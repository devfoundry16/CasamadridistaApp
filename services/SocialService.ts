import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { API_BASE_URL } from '@/config/supabase';
import { UPLOAD_METHODS } from '@/utils/uploadTarget.core';
import {
  normaliseBlocked,
  normaliseConversationHeader,
  normaliseFriends,
  normaliseGridPage,
  normaliseInbox,
  normaliseMessage,
  normaliseMessages,
  normaliseProfile,
  normaliseRequests,
  normaliseSearch,
  normaliseShare,
  normaliseSuggestions,
  normaliseUnread,
  normaliseUsernameCheck,
} from '@/services/social/normalise';
import type {
  StorySlot,
  StoryViewer,
  UserStory,
  UserStoryGroup,
  ChatMessage,
  ConversationHeader,
  EmbedKind,
  FriendAction,
  FriendRequests,
  FriendsPage,
  InboxPage,
  MessagesPage,
  PersonCard,
  ProfileGridPage,
  RelationshipState,
  SearchResult,
  ShareResult,
  SocialProfile,
  SocialReportReason,
  SuggestedPerson,
  UnreadCounts,
  UsernameCheck,
  MyAppeal,
  MyWarning,
} from '@/types/social';

const BASE = `${API_BASE_URL}social`;

/**
 * An API failure carrying the server's machine-readable code (`blocked`,
 * `taken`, `request_limit`…), so a screen can say something specific in the
 * user's language instead of echoing an English string.
 */
export class SocialApiError extends Error {
  code: string;
  status: number | null;
  constructor(code: string, status: number | null) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

export interface OutgoingMessage {
  client_id: string;
  body?: string | null;
  attachment_ids?: string[];
  embed_kind?: EmbedKind;
  embed_id?: string;
  /** The message this one replies to (same conversation). */
  reply_to_id?: string;
}

export interface AttachmentSlot {
  attachment_id: string;
  upload_url: string;
  /** 'POST' (multipart, field `field`) for a Cloudflare Images slot; absent for a PUT. */
  method?: string;
  field?: string;
  /** Supabase slots only. */
  token?: string;
  bucket?: string;
  path: string;
  /** A video's poster-frame slot, sent the way `thumbnail_method` says. */
  thumbnail_upload_url?: string;
  thumbnail_path?: string;
  thumbnail_method?: string;
  thumbnail_field?: string;
}

/**
 * Casa Social API (`/api/social`, `backend/routes/socialRoutes.js`).
 *
 * The same shape as `CasaMediaService`: a singleton, an `Authorization` header
 * read per call, and every response folded by `services/social/normalise.ts`.
 */
class SocialServiceClass {
  private async headers(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private fail(error: any): never {
    throw new SocialApiError(error?.response?.data?.error || 'network_error', error?.response?.status ?? null);
  }

  private async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const clean = Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== ''));
      const { data } = await axios.get(`${BASE}${path}`, { headers: await this.headers(), params: clean });
      return data as T;
    } catch (error) {
      this.fail(error);
    }
  }

  private async send<T>(method: 'post' | 'put' | 'patch' | 'delete', path: string, body?: unknown): Promise<T> {
    try {
      const headers = await this.headers();
      const { data } =
        method === 'delete'
          ? await axios.delete(`${BASE}${path}`, { headers })
          : await axios[method](`${BASE}${path}`, body ?? {}, { headers });
      return data as T;
    } catch (error) {
      this.fail(error);
    }
  }

  /* ---------------- profiles ---------------- */

  async getMe(): Promise<SocialProfile | null> {
    return normaliseProfile(await this.get('/me'));
  }

  async getProfile(userId: string): Promise<SocialProfile | null> {
    try {
      return normaliseProfile(await this.get(`/users/${encodeURIComponent(userId)}`));
    } catch (error) {
      // Not found and "blocked you" are the same answer by design.
      if (error instanceof SocialApiError && error.status === 404) return null;
      throw error;
    }
  }

  /**
   * A profile tab as grid cells (`layout=grid`). Saved is not here: it is your
   * own list, `PostService.savedGrid`. Null when the profile is not visible.
   */
  async userGrid(userId: string, tab: 'posts' | 'videos' | 'tagged', cursor?: string | null): Promise<ProfileGridPage | null> {
    try {
      return normaliseGridPage(await this.get(`/users/${encodeURIComponent(userId)}/posts`, { tab, layout: 'grid', cursor }));
    } catch (error) {
      if (error instanceof SocialApiError && error.status === 404) return null;
      throw error;
    }
  }

  async resolveHandle(handle: string): Promise<string | null> {
    try {
      const data = await this.get<{ id?: string }>(`/users/by-handle/${encodeURIComponent(handle.replace(/^@+/, ''))}`);
      return typeof data?.id === 'string' ? data.id : null;
    } catch (error) {
      if (error instanceof SocialApiError && error.status === 404) return null;
      throw error;
    }
  }

  async search(query: { q?: string; country?: string | null; fan_club_id?: string | null }): Promise<SearchResult[]> {
    return normaliseSearch(await this.get('/users/search', query));
  }

  async checkUsername(candidate?: string): Promise<UsernameCheck> {
    return normaliseUsernameCheck(await this.get('/me/username', candidate ? { candidate } : undefined));
  }

  async updateMe(patch: { display_name?: string | null; username?: string; bio?: string | null; show_activity?: boolean }): Promise<SocialProfile | null> {
    return normaliseProfile(await this.send('patch', '/me', patch));
  }

  /* ---------------- friends ---------------- */

  async friends(before?: string | null): Promise<FriendsPage> {
    return normaliseFriends(await this.get('/friends', { before }));
  }

  async requests(): Promise<FriendRequests> {
    return normaliseRequests(await this.get('/friends/requests'));
  }

  async suggestions(): Promise<SuggestedPerson[]> {
    return normaliseSuggestions(await this.get('/friends/suggestions'));
  }

  async blocked(): Promise<(PersonCard & { blocked_at: string | null })[]> {
    return normaliseBlocked(await this.get('/blocks'));
  }

  async act(userId: string, action: FriendAction): Promise<RelationshipState> {
    const data = await this.send<{ state?: RelationshipState }>('post', `/friends/${encodeURIComponent(userId)}/${action}`);
    return (data?.state ?? 'none') as RelationshipState;
  }

  /* ---------------- conversations ---------------- */

  async inbox(box: 'inbox' | 'requests', before?: string | null): Promise<InboxPage> {
    return normaliseInbox(await this.get('/conversations', { box, before }));
  }

  async unread(): Promise<UnreadCounts> {
    return normaliseUnread(await this.get('/conversations/unread'));
  }

  async open(userId: string): Promise<ConversationHeader> {
    const header = normaliseConversationHeader(await this.send('post', '/conversations', { user_id: userId }));
    if (!header) throw new SocialApiError('not_found', 404);
    return header;
  }

  async conversation(id: string): Promise<ConversationHeader | null> {
    try {
      return normaliseConversationHeader(await this.get(`/conversations/${encodeURIComponent(id)}`));
    } catch (error) {
      if (error instanceof SocialApiError && error.status === 404) return null;
      throw error;
    }
  }

  async messages(id: string, cursor?: string | null): Promise<MessagesPage> {
    return normaliseMessages(await this.get(`/conversations/${encodeURIComponent(id)}/messages`, { cursor }));
  }

  async sendMessage(id: string, message: OutgoingMessage): Promise<ChatMessage> {
    const data = await this.send<{ message?: unknown }>('post', `/conversations/${encodeURIComponent(id)}/messages`, message);
    const normalised = normaliseMessage(data?.message);
    if (!normalised) throw new SocialApiError('invalid_response', null);
    return normalised;
  }

  async acknowledge(id: string, marks: { read_at?: string; delivered_at?: string; viewing?: boolean }): Promise<void> {
    await this.send('post', `/conversations/${encodeURIComponent(id)}/read`, marks);
  }

  async acceptRequest(id: string): Promise<ConversationHeader | null> {
    return normaliseConversationHeader(await this.send('post', `/conversations/${encodeURIComponent(id)}/accept`));
  }

  async hide(id: string): Promise<void> {
    await this.send('delete', `/conversations/${encodeURIComponent(id)}`);
  }

  async createAttachment(
    id: string,
    file: { mime_type: string; size_bytes?: number; width?: number; height?: number; duration_ms?: number },
  ): Promise<AttachmentSlot> {
    return this.send<AttachmentSlot>('post', `/conversations/${encodeURIComponent(id)}/attachments`, { ...file, upload_methods: UPLOAD_METHODS });
  }

  /** One reaction per person per message; `null` takes it back. */
  async reactToMessage(messageId: string, emoji: string | null): Promise<void> {
    const path = `/messages/${encodeURIComponent(messageId)}/reaction`;
    if (emoji === null) await this.send('delete', path);
    else await this.send('put', path, { emoji });
  }

  /** Delete for me: gone from my thread only. */
  async hideMessage(messageId: string): Promise<void> {
    await this.send('post', `/messages/${encodeURIComponent(messageId)}/hide`);
  }

  /** Take my message back: both sides see that it was unsent. */
  async unsendMessage(messageId: string): Promise<void> {
    await this.send('post', `/messages/${encodeURIComponent(messageId)}/unsend`);
  }

  /** "Send to a friend", to several at once (§16, §37, §38). */
  async share(input: { recipient_ids: string[]; embed_kind: EmbedKind; embed_id: string; body?: string; client_id: string }): Promise<ShareResult[]> {
    return normaliseShare(await this.send('post', '/share', input));
  }

  /* ---------------- reports ---------------- */

  async report(input: { target_kind: 'message' | 'profile' | 'story'; target_id: string; reason: SocialReportReason; details?: string }): Promise<void> {
    await this.send('post', '/reports', input);
  }

  /* ---------------- appeals (admin §25) ---------------- */

  /**
   * Your appeals, whether the account is restricted, and whether that
   * restriction can still be appealed (not once an appeal on it was upheld).
   */
  async myAppeals(): Promise<{ data: MyAppeal[]; restricted: boolean; restrictionAppealable: boolean }> {
    const body = await this.get<{ data?: MyAppeal[]; restricted?: boolean; restriction_appealable?: boolean }>(
      '/appeals/mine'
    );
    return {
      data: body?.data ?? [],
      restricted: !!body?.restricted,
      restrictionAppealable: !!body?.restriction_appealable,
    };
  }

  async myWarnings(): Promise<MyWarning[]> {
    const body = await this.get<{ data?: MyWarning[] }>('/warnings/mine');
    return body?.data ?? [];
  }

  async appeal(input: { subject_kind: MyAppeal['subject_kind']; subject_id?: string | null; statement: string }): Promise<MyAppeal> {
    return this.send('post', '/appeals', input);
  }

  // ---------- stories (C1) ----------

  async storyFeed(): Promise<UserStoryGroup[]> {
    return (await this.get<{ data?: UserStoryGroup[] }>('/stories'))?.data ?? [];
  }

  /** One person's live stories, as a single group for the viewer. */
  async userStories(userId: string): Promise<UserStoryGroup> {
    const body = await this.get<{ data?: UserStory[]; author?: PersonCard | null }>(`/stories/user/${encodeURIComponent(userId)}`);
    const stories = body?.data ?? [];
    return { author_id: userId, author: body?.author ?? null, all_seen: stories.every((s) => s.seen), stories };
  }

  async createStorySlot(input: { kind: 'photo' | 'video'; mime_type: string; size_bytes: number; width?: number; height?: number; duration_ms?: number }): Promise<StorySlot> {
    return this.send('post', '/stories/slot', input);
  }

  async publishStory(id: string, caption: string | null): Promise<UserStory> {
    return this.send('post', `/stories/${encodeURIComponent(id)}/publish`, { caption });
  }

  async viewStory(id: string): Promise<void> {
    await this.send('post', `/stories/${encodeURIComponent(id)}/view`);
  }

  async storyViewers(id: string): Promise<{ count: number; viewers: StoryViewer[] }> {
    return this.get(`/stories/${encodeURIComponent(id)}/viewers`);
  }

  async deleteStory(id: string): Promise<void> {
    await this.send('delete', `/stories/${encodeURIComponent(id)}`);
  }

  async replyToStory(id: string, input: { body?: string; reaction?: string; client_id: string }): Promise<{ conversation_id: string }> {
    return this.send('post', `/stories/${encodeURIComponent(id)}/reply`, input);
  }

  async muteStories(userId: string, muted: boolean): Promise<void> {
    await this.send(muted ? 'post' : 'delete', `/stories/mutes/${encodeURIComponent(userId)}`);
  }
}

const SocialService = new SocialServiceClass();
export default SocialService;
