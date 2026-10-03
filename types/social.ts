/**
 * Casa Social types — the shape the UI consumes.
 *
 * The wire shapes are defined by `backend/services/social/*Service.js` and
 * pinned by `backend/test/socialContract.test.js`. `services/social/normalise.ts`
 * folds them into these types once, at the service boundary, and
 * `utils/__tests__/socialContract.test.mts` asserts that fold against fixtures
 * transcribed from the backend.
 *
 * The vocabularies below mirror the backend's frozen lists verbatim.
 */

/** relationshipRules.RELATIONSHIP_STATES, minus `blocked`: the API never tells a
 *  person they were blocked — that profile is simply not found. */
export const RELATIONSHIP_STATES = [
  'self',
  'blocking',
  'friends',
  'request_sent',
  'request_received',
  'none',
] as const;
export type RelationshipState = (typeof RELATIONSHIP_STATES)[number];

/** relationshipRules.FRIEND_ACTIONS */
export const FRIEND_ACTIONS = ['request', 'cancel', 'accept', 'decline', 'remove', 'block', 'unblock'] as const;
export type FriendAction = (typeof FRIEND_ACTIONS)[number];

/** conversationRules.MESSAGE_KINDS */
export const MESSAGE_KINDS = ['text', 'image', 'share', 'voice', 'video'] as const;
export type MessageKind = (typeof MESSAGE_KINDS)[number];

/** conversationRules.EMBED_KINDS — what "Send to a friend" can carry. */
export const EMBED_KINDS = ['post', 'media_item', 'profile', 'story'] as const;
export type EmbedKind = (typeof EMBED_KINDS)[number];

/** `pending` and `failed` exist only on the device; the server sends the rest. */
export type ReceiptState = 'pending' | 'failed' | 'sent' | 'delivered' | 'seen';

/** reportRules.REPORT_REASONS — §23 verbatim. */
export const SOCIAL_REPORT_REASONS = [
  'spam',
  'harassment',
  'hate',
  'sexual',
  'impersonation',
  'scam',
  'threat',
  'other',
] as const;
export type SocialReportReason = (typeof SOCIAL_REPORT_REASONS)[number];

/** The compact person every social list uses. */
export interface PersonCard {
  id: string;
  username: string | null;
  /** Never null in the UI: the normaliser falls back to the handle, then ''. */
  name: string;
  avatar_url: string | null;
  country_code: string | null;
  is_member: boolean;
  is_verified: boolean;
}

export interface ProfileUser extends PersonCard {
  bio: string | null;
  joined_at: string | null;
  /** Only for yourself and friends, and only while the owner shows activity. */
  last_active_at: string | null;
  /** Present on your own profile only. */
  show_activity?: boolean;
  display_name?: string | null;
  fan_club_id?: string | null;
  /** The fan club the person is registered with, shown to every viewer. */
  fan_club: ProfileFanClub | null;
  /** An active Casa Media contributor: their profile gets a Media tab. */
  is_media_contributor: boolean;
}

export interface ProfileFanClub {
  id: string;
  name: string;
  logo_url: string | null;
}

/**
 * One cell of the profile grid (`layout=grid`): enough to draw a thumbnail and
 * its badge, nothing more. `thumb_url` is null for a text post.
 */
export interface ProfileGridItem {
  id: string;
  kind: 'text' | 'image' | 'video' | 'media_teaser';
  thumb_url: string | null;
  media_count: number;
  is_video: boolean;
  created_at: string | null;
}

export interface ProfileGridPage {
  items: ProfileGridItem[];
  nextCursor: string | null;
}

export interface SocialProfile {
  user: ProfileUser;
  stats: { posts: number; friends: number; joined_year: number | null };
  relationship: { state: RelationshipState; can_message: boolean };
}

/** Your own appeal against a moderation decision (admin §25). */
export interface MyAppeal {
  id: string;
  subject_kind: 'restriction' | 'warning';
  subject_id: string | null;
  status: 'open' | 'upheld' | 'overturned';
  decision_note: string | null;
  decided_at: string | null;
  created_at: string;
}

/** A formal warning on your account. Who issued it is not shown. */
export interface MyWarning {
  id: string;
  reason: string;
  source_kind: string;
  created_at: string;
  withdrawn_at: string | null;
}

export interface SearchResult extends PersonCard {
  relationship: RelationshipState;
}

export interface SuggestedPerson extends PersonCard {
  reason: 'mutual' | 'interaction' | 'fan_club' | 'country';
  mutual_count: number;
}

export interface FriendRequests {
  incoming: (PersonCard & { requested_at: string | null })[];
  outgoing: (PersonCard & { requested_at: string | null })[];
}

export interface FriendsPage {
  /** `last_active_at`: null when that friend hides their activity (§18). */
  friends: (PersonCard & { friends_since: string | null; last_active_at: string | null })[];
  next_before: string | null;
}

export interface UsernameCheck {
  username?: string;
  available?: boolean;
  reason?: string | null;
  current?: string | null;
  suggestions?: string[];
}

export interface MessagePreview {
  /** 'text' | 'photo' | 'removed' | 'empty' | `share_${EmbedKind}` */
  key: string;
  text: string | null;
}

export interface ConversationSummary {
  id: string;
  other: PersonCard;
  is_request: boolean;
  unread_count: number;
  can_write: boolean;
  last_message_at: string | null;
  last_message: {
    id: string;
    sender_id: string;
    kind: MessageKind;
    status: MessageStatus;
    created_at: string;
    preview: MessagePreview;
    receipt: ReceiptState | null;
  } | null;
}

export interface InboxPage {
  conversations: ConversationSummary[];
  next_before: string | null;
  unread: UnreadCounts;
}

export interface UnreadCounts {
  inbox: number;
  requests: number;
}

export interface ConversationHeader {
  id: string;
  other: PersonCard;
  relationship: RelationshipState;
  is_request: boolean;
  can_write: boolean;
  write_blocked_reason: 'you_blocked' | 'unavailable' | null;
  other_last_delivered_at: string | null;
  other_last_read_at: string | null;
}

/** `unsent` is the sender taking it back; `hidden` exists only in an inbox row (deleted for me). */
export type MessageStatus = 'visible' | 'removed' | 'unsent' | 'hidden';

export interface MessageAttachment {
  id: string;
  /** conversationRules.attachmentKind; photos when the server says nothing. */
  kind: 'image' | 'voice' | 'video';
  mime_type: string;
  duration_ms?: number | null;
  /** A video's poster frame. */
  thumbnail_url?: string | null;
  width: number | null;
  height: number | null;
  url: string | null;
  url_expires_at: string | null;
  /** Device-only: the local file shown while the upload is in flight. */
  local_uri?: string;
}

/** A shared post, media item or profile, resolved for the reader. */
export interface MessageEmbed {
  kind: EmbedKind;
  id: string;
  available: boolean;
  title: string | null;
  subtitle: string | null;
  image_url: string | null;
  /** Media items only: the server-side lock, never derived here. */
  locked: boolean;
  person: PersonCard | null;
  /** Stories only: past its 24 hours (the reply still reads, the story is gone). */
  expired?: boolean;
  /** Stories only: whose story it is, to open their stories. */
  author_id?: string | null;
}

/** What a reply shows of the message it quotes. */
export interface MessageQuote {
  id: string;
  sender_id: string;
  kind: MessageKind;
  /** `unavailable`: unsent, removed, or deleted by this reader — no body then. */
  status: 'visible' | 'unavailable';
  body: string | null;
}

export interface MessageReactions {
  counts: { emoji: string; count: number }[];
  mine: string | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  kind: MessageKind;
  body: string | null;
  status: Exclude<MessageStatus, 'hidden'>;
  client_id: string | null;
  created_at: string;
  attachments: MessageAttachment[];
  embed: MessageEmbed | null;
  receipt: ReceiptState | null;
  reply_to: MessageQuote | null;
  reactions: MessageReactions;
}

export interface MessagesPage {
  messages: ChatMessage[];
  nextCursor: string | null;
}

export interface ShareResult {
  user_id: string;
  ok: boolean;
  conversation_id?: string;
  reason?: string;
}

/** What a device learns from a `conversation:<id>` broadcast. */
export interface RealtimeMessageEvent {
  id: string;
  conversation_id: string;
  sender_id: string;
  kind: MessageKind;
  body: string | null;
  embed_kind: EmbedKind | null;
  reply_to_id?: string | null;
  client_id: string | null;
  created_at: string;
}

export interface RealtimeReceiptEvent {
  conversation_id: string;
  user_id: string;
  last_delivered_at: string | null;
  last_read_at: string | null;
}

// ---------- user stories (C1) ----------

export interface UserStory {
  id: string;
  author_id: string;
  kind: 'photo' | 'video';
  caption: string | null;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
  published_at: string | null;
  expires_at: string | null;
  seen: boolean;
  /** Photo, signed for a few minutes. */
  url: string | null;
  /** Video, a signed HLS manifest. */
  hls_url: string | null;
  thumbnail_url: string | null;
  url_expires_at: string | null;
  status?: string;
}

export interface UserStoryGroup {
  author_id: string;
  author: PersonCard | null;
  all_seen: boolean;
  stories: UserStory[];
}

export interface StorySlot {
  story_id: string;
  kind: 'photo' | 'video';
  upload_url: string;
  method: 'PUT' | 'POST';
  token?: string;
}

export interface StoryViewer {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  viewed_at: string;
}
