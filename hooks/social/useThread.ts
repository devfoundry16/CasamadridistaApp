import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import SocialService, { SocialApiError } from '@/services/SocialService';
import { subscribeConversation, subscribeTyping } from '@/services/social/realtime';
import type { ChatMessage, EmbedKind, MessageAttachment, MessageKind, MessageQuote, RealtimeMessageEvent } from '@/types/social';
import {
  LOCAL_PREFIX,
  applyReaction,
  applyReceipts,
  dropForMe,
  freshPage,
  undoDrop,
  undoRetract,
  isLocal,
  isTyping as typingActive,
  mergeMessages,
  messageFromEvent,
  needsFetch,
  newClientId,
  newestFromOthers,
  retract,
  shouldSendTyping,
  TYPING_SHOW_FOR_MS,
} from '@/utils/chat.core';
import { socialKeys } from './keys';

/**
 * Thread state survives leaving and re-entering the screen, so going back to
 * the inbox and returning is instant. Module-level rather than React Query:
 * a chat merges three sources (pages, optimistic sends, broadcasts) into one
 * list, which an infinite query's page structure fights at every step.
 */
interface ThreadCache {
  messages: ChatMessage[];
  cursor: string | null;
  exhausted: boolean;
}
const threads = new Map<string, ThreadCache>();

/** How long a burst of reaction events is gathered before one refetch. */
const REACTION_REFRESH_MS = 800;

/** Longest edge a message photo is resized to before upload. */
const PHOTO_MAX_EDGE = 1600;

export interface PhotoInput {
  uri: string;
  width: number | null;
  height: number | null;
}

/** A recorded voice note (m4a / AAC, from expo-audio's high-quality preset). */
export interface VoiceInput {
  uri: string;
  durationMs: number;
}

/** A picked video, already checked against videoPickProblem. */
export interface VideoInput {
  uri: string;
  durationMs: number;
  width: number | null;
  height: number | null;
  mimeType: string | null;
}

export interface OutgoingInput {
  body?: string;
  photos?: PhotoInput[];
  voice?: VoiceInput;
  video?: VideoInput;
  embed?: { kind: EmbedKind; id: string };
  /** The message being replied to. */
  replyTo?: ChatMessage | null;
}

interface PendingInput {
  body: string | null;
  photos: PhotoInput[];
  voice?: VoiceInput;
  video?: VideoInput;
  embed?: { kind: EmbedKind; id: string };
  replyToId?: string;
}

/** What a local reply shows of its original until the server's copy lands. */
function quoteFrom(message: ChatMessage): MessageQuote {
  return { id: message.id, sender_id: message.sender_id, kind: message.kind, status: 'visible', body: message.body };
}

/**
 * One conversation: paged history, realtime merge, optimistic send with retry,
 * read receipts and typing.
 *
 * @param focused whether the thread is on screen — reads are only acknowledged
 *        while it is, so "seen" means seen.
 */
export function useThread(conversationId: string | undefined, myId: string | undefined, focused: boolean) {
  const queryClient = useQueryClient();
  const cached = conversationId ? threads.get(conversationId) : undefined;
  const [messages, setMessages] = useState<ChatMessage[]>(cached?.messages ?? []);
  const [loading, setLoading] = useState(!cached);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otherTypingAt, setOtherTypingAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const cursorRef = useRef<string | null>(cached?.cursor ?? null);
  const exhaustedRef = useRef<boolean>(cached?.exhausted ?? false);
  const messagesRef = useRef(messages);
  const lastReadAckRef = useRef<string | null>(null);
  const lastTypingSentRef = useRef<number | null>(null);
  const typingRef = useRef<ReturnType<typeof subscribeTyping> | null>(null);
  const pendingInputs = useRef(new Map<string, PendingInput>());
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Retractions heard on the channel while this thread has been open. */
  const goneRef = useRef(new Map<string, 'removed' | 'unsent'>());

  /** Every state change goes through here, so the cache and ref stay in step. */
  const commit = useCallback(
    (next: ChatMessage[]) => {
      messagesRef.current = next;
      setMessages(next);
      if (conversationId) {
        threads.set(conversationId, { messages: next, cursor: cursorRef.current, exhausted: exhaustedRef.current });
      }
    },
    [conversationId],
  );

  const merge = useCallback((incoming: ChatMessage[]) => commit(mergeMessages(messagesRef.current, incoming)), [commit]);

  // ---------- history ----------

  /**
   * @param fresh on opening the thread and on returning to the app: start
   *        again from the server's newest page (`freshPage`), so nothing that
   *        was unsent or removed while realtime was not listening stays
   *        readable from the cache. Otherwise the page is merged in.
   */
  const loadNewest = useCallback(async (fresh = false) => {
    if (!conversationId) return;
    // What was held when the request started: anything that arrives while it
    // is in flight is newer than the page and must survive a fresh start.
    const heldBefore = new Set(messagesRef.current.map((m) => m.id));
    try {
      const page = await SocialService.messages(conversationId, null);
      if (fresh || !threads.has(conversationId)) {
        cursorRef.current = page.nextCursor;
        exhaustedRef.current = !page.nextCursor;
      }
      if (fresh) commit(freshPage(messagesRef.current, page.messages, heldBefore));
      else merge(page.messages);
      setError(null);
    } catch (e) {
      setError(e instanceof SocialApiError ? e.code : 'network_error');
    } finally {
      setLoading(false);
    }
  }, [conversationId, merge, commit]);

  const loadOlder = useCallback(async () => {
    if (!conversationId || loadingOlder || exhaustedRef.current || !cursorRef.current) return;
    setLoadingOlder(true);
    try {
      const page = await SocialService.messages(conversationId, cursorRef.current);
      cursorRef.current = page.nextCursor;
      exhaustedRef.current = !page.nextCursor;
      merge(page.messages);
    } catch {
      // Scrolling up again retries.
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, loadingOlder, merge]);

  useEffect(() => {
    void loadNewest(true);
  }, [loadNewest]);

  // ---------- realtime ----------

  useEffect(() => {
    if (!conversationId || !myId) return;

    const onMessage = (event: RealtimeMessageEvent) => {
      const renderable = messageFromEvent(event, myId);
      if (renderable) merge([renderable]);
      // Photos and shares need signed URLs and an access-checked embed.
      if (needsFetch(event)) void loadNewest();
      if (event.sender_id !== myId) {
        setOtherTypingAt(null);
        void queryClient.invalidateQueries({ queryKey: socialKeys.inbox('inbox') });
      }
    };

    const offConversation = subscribeConversation(conversationId, {
      onMessage,
      onReceipt: (event) => {
        if (event.user_id === myId) return;
        commit(applyReceipts(messagesRef.current, myId, event));
      },
      // Remembered as well as applied: a message that is out of the list at
      // that moment (an optimistic delete-for-me) must not come back whole.
      onRemoved: (event) => {
        goneRef.current.set(event.id, 'removed');
        commit(retract(messagesRef.current, event.id, 'removed'));
      },
      onUnsent: (event) => {
        if (!goneRef.current.has(event.id)) goneRef.current.set(event.id, 'unsent');
        commit(retract(messagesRef.current, event.id, 'unsent'));
      },
      // Counts come from the API, never from the event. Only for a message on
      // screen, and a burst of reactions costs one fetch. The newest page
      // covers the reactions people actually make; an older one refreshes on
      // return.
      onReaction: (event) => {
        if (!messagesRef.current.some((m) => m.id === event.message_id)) return;
        if (reactionTimer.current) clearTimeout(reactionTimer.current);
        reactionTimer.current = setTimeout(() => {
          reactionTimer.current = null;
          void loadNewest();
        }, REACTION_REFRESH_MS);
      },
    });

    const typing = subscribeTyping(conversationId, myId, () => setOtherTypingAt(Date.now()));
    typingRef.current = typing;

    // A socket can drop while backgrounded; catch up on return.
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void loadNewest(true);
    });

    return () => {
      offConversation();
      if (reactionTimer.current) clearTimeout(reactionTimer.current);
      typing.unsubscribe();
      typingRef.current = null;
      appState.remove();
    };
  }, [conversationId, myId, merge, commit, loadNewest, queryClient]);

  // Expire the typing indicator without a timer per event.
  useEffect(() => {
    if (otherTypingAt === null) return;
    const id = setTimeout(() => setNow(Date.now()), TYPING_SHOW_FOR_MS + 50);
    return () => clearTimeout(id);
  }, [otherTypingAt]);

  // ---------- read receipts ----------

  useEffect(() => {
    if (!focused || !conversationId || !myId) return;
    const newest = newestFromOthers(messages, myId);
    if (!newest || lastReadAckRef.current === newest.id) return;
    lastReadAckRef.current = newest.id;
    void SocialService.acknowledge(conversationId, { read_at: newest.created_at, viewing: true })
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: socialKeys.unread() });
        void queryClient.invalidateQueries({ queryKey: socialKeys.inbox('inbox') });
      })
      .catch(() => {
        lastReadAckRef.current = null;
      });
  }, [focused, conversationId, myId, messages, queryClient]);

  // While the thread is open, keep telling the server so pushes stay quiet.
  useEffect(() => {
    if (!focused || !conversationId) return;
    const id = setInterval(() => {
      void SocialService.acknowledge(conversationId, { viewing: true }).catch(() => {});
    }, 25_000);
    return () => clearInterval(id);
  }, [focused, conversationId]);

  // ---------- sending ----------

  const deliver = useCallback(
    async (clientId: string) => {
      const input = pendingInputs.current.get(clientId);
      if (!conversationId || !myId || !input) return;
      const localId = `${LOCAL_PREFIX}${clientId}`;
      const markLocal = (patch: Partial<ChatMessage>) =>
        commit(messagesRef.current.map((m) => (m.id === localId ? { ...m, ...patch } : m)));

      markLocal({ receipt: 'pending' });
      try {
        const attachmentIds: string[] = [];
        for (const photo of input.photos) attachmentIds.push(await uploadPhoto(conversationId, photo));
        if (input.voice) attachmentIds.push(await uploadVoice(conversationId, input.voice));
        if (input.video) attachmentIds.push(await uploadVideo(conversationId, input.video));

        const sent = await SocialService.sendMessage(conversationId, {
          client_id: clientId,
          body: input.body,
          ...(attachmentIds.length ? { attachment_ids: attachmentIds } : {}),
          ...(input.embed ? { embed_kind: input.embed.kind, embed_id: input.embed.id } : {}),
          ...(input.replyToId ? { reply_to_id: input.replyToId } : {}),
        });
        pendingInputs.current.delete(clientId);
        merge([sent]);
        void queryClient.invalidateQueries({ queryKey: socialKeys.inbox('inbox') });
        void queryClient.invalidateQueries({ queryKey: socialKeys.inbox('requests') });
      } catch (e) {
        const code = e instanceof SocialApiError ? e.code : 'network_error';
        markLocal({ receipt: 'failed' });
        setError(code);
      }
    },
    [conversationId, myId, commit, merge, queryClient],
  );

  const send = useCallback(
    (input: OutgoingInput) => {
      if (!conversationId || !myId) return;
      const body = input.body?.trim() || null;
      const photos = input.photos ?? [];
      if (!body && !photos.length && !input.embed && !input.voice && !input.video) return;
      const replyTo = input.replyTo && !isLocal(input.replyTo) && input.replyTo.status === 'visible' ? input.replyTo : null;

      const clientId = newClientId(Date.now(), Crypto.randomUUID());
      pendingInputs.current.set(clientId, {
        body,
        photos,
        voice: input.voice,
        video: input.video,
        embed: input.embed,
        replyToId: replyTo?.id,
      });
      const kind: MessageKind = input.embed ? 'share' : input.voice ? 'voice' : input.video ? 'video' : photos.length ? 'image' : 'text';
      const attachments: MessageAttachment[] = input.voice
        ? [{ id: `${clientId}_0`, kind: 'voice', mime_type: 'audio/mp4', width: null, height: null, duration_ms: input.voice.durationMs, url: null, url_expires_at: null, local_uri: input.voice.uri }]
        : input.video
          ? [{ id: `${clientId}_0`, kind: 'video', mime_type: input.video.mimeType ?? 'video/mp4', width: input.video.width, height: input.video.height, duration_ms: input.video.durationMs, url: null, url_expires_at: null, local_uri: input.video.uri }]
          : photos.map((p, i) => ({
              id: `${clientId}_${i}`,
              kind: 'image' as const,
              mime_type: 'image/jpeg',
              width: p.width,
              height: p.height,
              url: null,
              url_expires_at: null,
              local_uri: p.uri,
            }));
      merge([
        {
          id: `${LOCAL_PREFIX}${clientId}`,
          conversation_id: conversationId,
          sender_id: myId,
          kind,
          body,
          status: 'visible',
          client_id: clientId,
          created_at: new Date().toISOString(),
          attachments,
          embed: null,
          receipt: 'pending',
          reply_to: replyTo ? quoteFrom(replyTo) : null,
          reactions: { counts: [], mine: null },
        },
      ]);
      lastTypingSentRef.current = null;
      void deliver(clientId);
    },
    [conversationId, myId, merge, deliver],
  );

  const retry = useCallback((message: ChatMessage) => {
    if (isLocal(message) && message.client_id) void deliver(message.client_id);
  }, [deliver]);

  const discard = useCallback((message: ChatMessage) => {
    if (!isLocal(message) || !message.client_id) return;
    pendingInputs.current.delete(message.client_id);
    commit(messagesRef.current.filter((m) => m.id !== message.id));
  }, [commit]);

  // ---------- reactions, delete for me, unsend ----------

  /** Optimistic; a refusal puts the old reactions back. */
  const react = useCallback(async (message: ChatMessage, emoji: string | null) => {
    if (isLocal(message)) return;
    const before = message.reactions;
    const after = applyReaction(before, emoji);
    const patch = (reactions: typeof before) =>
      commit(messagesRef.current.map((m) => (m.id === message.id ? { ...m, reactions } : m)));
    patch(after);
    try {
      await SocialService.reactToMessage(message.id, after.mine);
    } catch (e) {
      patch(before);
      setError(e instanceof SocialApiError ? e.code : 'network_error');
    }
  }, [commit]);

  const hideMessage = useCallback(async (message: ChatMessage) => {
    if (isLocal(message)) return;
    const before = messagesRef.current;
    commit(dropForMe(before, message.id));
    try {
      await SocialService.hideMessage(message.id);
    } catch (e) {
      commit(undoDrop(messagesRef.current, before, message.id, goneRef.current.get(message.id) ?? null));
      setError(e instanceof SocialApiError ? e.code : 'network_error');
    }
  }, [commit]);

  const unsend = useCallback(async (message: ChatMessage) => {
    if (isLocal(message)) return;
    const before = messagesRef.current;
    commit(retract(before, message.id, 'unsent'));
    try {
      await SocialService.unsendMessage(message.id);
      void queryClient.invalidateQueries({ queryKey: socialKeys.inbox('inbox') });
    } catch (e) {
      // Only our own optimistic tombstone is undone: a removal that arrived
      // meanwhile stays.
      commit(undoRetract(messagesRef.current, before, message.id));
      setError(e instanceof SocialApiError ? e.code : 'network_error');
    }
  }, [commit, queryClient]);

  const notifyTyping = useCallback(() => {
    const at = Date.now();
    if (!shouldSendTyping(lastTypingSentRef.current, at)) return;
    lastTypingSentRef.current = at;
    typingRef.current?.send();
  }, []);

  return {
    messages,
    loading,
    loadingOlder,
    hasOlder: !exhaustedRef.current,
    error,
    clearError: () => setError(null),
    otherTyping: typingActive(otherTypingAt, Math.max(now, Date.now())),
    loadOlder,
    refresh: () => loadNewest(true),
    send,
    retry,
    discard,
    react,
    hideMessage,
    unsend,
    notifyTyping,
  };
}

async function sizeOf(uri: string): Promise<number | undefined> {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists && typeof info.size === 'number' ? info.size : undefined;
}

async function put(url: string, uri: string, contentType: string) {
  const result = await FileSystem.uploadAsync(url, uri, {
    httpMethod: 'PUT',
    headers: { 'Content-Type': contentType },
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });
  if (result.status >= 300) throw new SocialApiError('upload_failed', result.status);
}

/** Reserve a voice slot (size and length up front) and upload the recording. */
async function uploadVoice(conversationId: string, voice: VoiceInput): Promise<string> {
  const slot = await SocialService.createAttachment(conversationId, {
    mime_type: 'audio/mp4',
    size_bytes: await sizeOf(voice.uri),
    duration_ms: Math.round(voice.durationMs),
  });
  await put(slot.upload_url, voice.uri, 'audio/mp4');
  return slot.attachment_id;
}

/**
 * Reserve a video slot, upload the clip and its poster frame. The frame is
 * what the server's image scan sees and what the bubble shows before play.
 */
async function uploadVideo(conversationId: string, video: VideoInput): Promise<string> {
  const mime = video.mimeType === 'video/quicktime' ? 'video/quicktime' : 'video/mp4';
  const { uri: frame } = await VideoThumbnails.getThumbnailAsync(video.uri, { time: 500, quality: 0.7 });
  const slot = await SocialService.createAttachment(conversationId, {
    mime_type: mime,
    size_bytes: await sizeOf(video.uri),
    duration_ms: Math.round(video.durationMs),
    ...(video.width ? { width: video.width } : {}),
    ...(video.height ? { height: video.height } : {}),
  });
  if (!slot.thumbnail_upload_url) throw new SocialApiError('invalid_response', null);
  await put(slot.thumbnail_upload_url, frame, 'image/jpeg');
  await put(slot.upload_url, video.uri, mime);
  return slot.attachment_id;
}

/** Resize, reserve a slot, PUT to the signed URL. Returns the attachment id. */
async function uploadPhoto(conversationId: string, photo: PhotoInput): Promise<string> {
  const longest = Math.max(photo.width ?? 0, photo.height ?? 0);
  const resize =
    longest > PHOTO_MAX_EDGE
      ? [{ resize: (photo.width ?? 0) >= (photo.height ?? 0) ? { width: PHOTO_MAX_EDGE } : { height: PHOTO_MAX_EDGE } }]
      : [];
  const prepared = await ImageManipulator.manipulateAsync(photo.uri, resize, {
    compress: 0.8,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  const info = await FileSystem.getInfoAsync(prepared.uri);

  const slot = await SocialService.createAttachment(conversationId, {
    mime_type: 'image/jpeg',
    ...(info.exists && typeof info.size === 'number' ? { size_bytes: info.size } : {}),
    width: prepared.width,
    height: prepared.height,
  });

  const result = await FileSystem.uploadAsync(slot.upload_url, prepared.uri, {
    httpMethod: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });
  if (result.status >= 300) throw new SocialApiError('upload_failed', result.status);
  return slot.attachment_id;
}

/** Drop every cached thread — on sign-out, nothing private may linger. */
export function clearThreadCache() {
  threads.clear();
}
