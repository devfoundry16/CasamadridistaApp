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
export const MESSAGE_KINDS = ['text', 'image', 'share'] as const;
export type MessageKind = (typeof MESSAGE_KINDS)[number];

/** conversationRules.EMBED_KINDS — what "Send to a friend" can carry. */
export const EMBED_KINDS = ['post', 'media_item', 'profile'] as const;
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
}

export interface SocialProfile {
  user: ProfileUser;
  stats: { posts: number; friends: number; joined_year: number | null };
  relationship: { state: RelationshipState; can_message: boolean };
}

export interface SearchResult extends PersonCard {
  relationship: RelationshipState;
}

export interface SuggestedPerson extends PersonCard {
  reason: 'mutual' | 'fan_club' | 'country';
  mutual_count: number;
}

export interface FriendRequests {
  incoming: (PersonCard & { requested_at: string | null })[];
  outgoing: (PersonCard & { requested_at: string | null })[];
}

export interface FriendsPage {
  friends: (PersonCard & { friends_since: string | null })[];
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
    status: 'visible' | 'removed';
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

export interface MessageAttachment {
  id: string;
  mime_type: string;
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
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  kind: MessageKind;
  body: string | null;
  status: 'visible' | 'removed';
  client_id: string | null;
  created_at: string;
  attachments: MessageAttachment[];
  embed: MessageEmbed | null;
  receipt: ReceiptState | null;
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
  client_id: string | null;
  created_at: string;
}

export interface RealtimeReceiptEvent {
  conversation_id: string;
  user_id: string;
  last_delivered_at: string | null;
  last_read_at: string | null;
}
