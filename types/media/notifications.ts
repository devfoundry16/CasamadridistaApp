/**
 * Notification wire types. The `data` blob is byte-identical between the Expo
 * push payload and the inbox row (plan §4.5) — one parser serves both.
 */

export type PushPayloadType =
  | 'media_item'
  | 'media_match'
  | 'media_digest'
  | 'custom'
  // A manager invited this account to contribute to Casa Media.
  | 'contributor_invite'
  // A warning, or a decision on the person's appeal: opens the appeals screen.
  | 'safety_notice'
  // Casa Social (`backend/services/notifications/payload.js` SOCIAL_TYPES).
  | 'friend_request'
  | 'friend_accept'
  | 'dm'
  | 'post_like'
  | 'post_comment'
  | 'mention'
  | 'tag';

export interface PushPayload {
  v: number;
  type: PushPayloadType;
  item_id?: string;
  match_id?: number;
  campaign_id?: string;
  /** Social: the person a notification is about (who liked, commented, mentioned…), or a DM's sender. */
  user_id?: string;
  /** Social: the conversation a DM push opens. */
  conversation_id?: string;
  /** Social: the name to localise "X sent you a friend request" with. */
  actor_name?: string;
  /** Social: the post a like, comment, mention or tag is about. */
  post_id?: string;
  /** Social: the comment, for a comment or a mention made in one. */
  comment_id?: string;
  /** Social: a post_comment that answers the recipient's own comment. */
  reply?: boolean;
  /** safety_notice: 'warning' | 'appeal_overturned' | 'appeal_upheld' — the title is localised from it. */
  subtype?: string;
  /** casamadridistaapp://media/item/<uuid>?c=<campaign_id> */
  url?: string;
  /** https://<MEDIA_LINK_DOMAIN>/m/<uuid> */
  web_url?: string;
}

/**
 * One `notifications` row. There is no `image_url` column — a thumbnail is
 * derived from `data.item_id` when one is wanted, or simply not shown.
 */
export interface InboxNotification {
  id: string;
  kind?: string | null;
  title: string | null;
  body: string | null;
  campaign_id?: string | null;
  read_at: string | null;
  created_at: string;
  data: PushPayload | null;
}

export interface InboxPage {
  notifications: InboxNotification[];
  nextCursor: string | null;
  unread_count: number;
}

/**
 * `POST /api/notifications/devices`, exactly as `deviceService.upsertDevice`
 * reads it. The token key is `expo_push_token` — a body keyed `token` is
 * rejected with "A valid Expo push token is required".
 */
export interface DeviceRegistration {
  expo_push_token: string;
  platform: 'ios' | 'android' | 'web';
  device_name?: string | null;
  app_version?: string | null;
  locale?: string | null;
  country_code?: string;
  timezone?: string | null;
  /** Ownership proof for a device registered while logged out. Always sent. */
  anon_id: string;
  topics?: string[];
}
