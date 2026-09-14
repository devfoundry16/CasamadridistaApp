import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import SocialService, { SocialApiError } from '@/services/SocialService';
import { subscribeConversation, subscribeTyping } from '@/services/social/realtime';
import type { ChatMessage, EmbedKind, RealtimeMessageEvent } from '@/types/social';
import {
  LOCAL_PREFIX,
  applyReceipts,
  isLocal,
  isTyping as typingActive,
  mergeMessages,
  messageFromEvent,
  needsFetch,
  newClientId,
  newestFromOthers,
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

/** Longest edge a message photo is resized to before upload. */
const PHOTO_MAX_EDGE = 1600;

export interface PhotoInput {
  uri: string;
  width: number | null;
  height: number | null;
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
  const pendingInputs = useRef(new Map<string, { body: string | null; photos: PhotoInput[]; embed?: { kind: EmbedKind; id: string } }>());

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

  const loadNewest = useCallback(async () => {
    if (!conversationId) return;
    try {
      const page = await SocialService.messages(conversationId, null);
      if (!threads.has(conversationId)) {
        cursorRef.current = page.nextCursor;
        exhaustedRef.current = !page.nextCursor;
      }
      merge(page.messages);
      setError(null);
    } catch (e) {
      setError(e instanceof SocialApiError ? e.code : 'network_error');
    } finally {
      setLoading(false);
    }
  }, [conversationId, merge]);

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
    void loadNewest();
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
      onRemoved: (event) => {
        commit(
          messagesRef.current.map((m) =>
            m.id === event.id ? { ...m, status: 'removed', body: null, attachments: [], embed: null } : m,
          ),
        );
      },
    });

    const typing = subscribeTyping(conversationId, myId, () => setOtherTypingAt(Date.now()));
    typingRef.current = typing;

    // A socket can drop while backgrounded; catch up on return.
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void loadNewest();
    });

    return () => {
      offConversation();
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

        const sent = await SocialService.sendMessage(conversationId, {
          client_id: clientId,
          body: input.body,
          ...(attachmentIds.length ? { attachment_ids: attachmentIds } : {}),
          ...(input.embed ? { embed_kind: input.embed.kind, embed_id: input.embed.id } : {}),
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
    (input: { body?: string; photos?: PhotoInput[]; embed?: { kind: EmbedKind; id: string } }) => {
      if (!conversationId || !myId) return;
      const body = input.body?.trim() || null;
      const photos = input.photos ?? [];
      if (!body && !photos.length && !input.embed) return;

      const clientId = newClientId(Date.now(), Crypto.randomUUID());
      pendingInputs.current.set(clientId, { body, photos, embed: input.embed });
      merge([
        {
          id: `${LOCAL_PREFIX}${clientId}`,
          conversation_id: conversationId,
          sender_id: myId,
          kind: input.embed ? 'share' : photos.length ? 'image' : 'text',
          body,
          status: 'visible',
          client_id: clientId,
          created_at: new Date().toISOString(),
          attachments: photos.map((p, i) => ({
            id: `${clientId}_${i}`,
            mime_type: 'image/jpeg',
            width: p.width,
            height: p.height,
            url: null,
            url_expires_at: null,
            local_uri: p.uri,
          })),
          embed: null,
          receipt: 'pending',
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
    refresh: loadNewest,
    send,
    retry,
    discard,
    notifyTyping,
  };
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
