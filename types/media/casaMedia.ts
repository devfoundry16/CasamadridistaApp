/**
 * Casa Media **internal** types — the shape the UI consumes.
 *
 * These are deliberately NOT the wire shape. The backend serializer
 * (`backend/services/casaMedia/serializers.js`) is the source of truth for what
 * arrives on the wire: nested `cover`, `counts`, `viewer`, a flat `match` ref,
 * `short_description`, `match_phase`, `tags: [{slug,…}]`. `services/media/normalise.ts`
 * folds all of that into the flat shape below, once, at the service boundary
 * (see the contract addendum). No screen ever touches a wire field.
 */

export type MediaAccessLevel = 'public' | 'registered' | 'premium';

/** The four types a consumer can see. The item vocabulary on the backend is
 *  wider (update, live, audio, interview) but none of those ship in V1. */
export const MEDIA_ITEM_TYPES = ['photo', 'video', 'gallery', 'story'] as const;

export type MediaItemType = (typeof MEDIA_ITEM_TYPES)[number];

/**
 * Match-day phase an item belongs to. These six values are the contract — the
 * backend stores them verbatim (`media_items.phase`) and `GET /matches/:id`
 * keys `phase_counts` by them. Do not add client-side synonyms.
 */
export const MEDIA_PHASES = [
  'pre_match',
  'arrival',
  'inside_stadium',
  'match_window',
  'full_time',
  'post_match',
] as const;

export type MediaPhase = (typeof MEDIA_PHASES)[number];

export type MediaAssetKind = 'image' | 'video';

export type MediaAssetStatus =
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'failed';

export interface MediaAsset {
  id: string;
  /** Not on the consumer wire (`serializeAsset` omits it); filled in by the normaliser. */
  item_id: string;
  kind: MediaAssetKind;
  /** 'main' for gallery/photo pages, 'cover' for the teaser image. */
  role: string | null;
  position: number;
  status: MediaAssetStatus;
  /** Signed (photos) or public (covers) still image. */
  url: string | null;
  /** Cloudflare Stream HLS manifest for videos. */
  hls_url: string | null;
  thumbnail_url: string | null;
  blurhash: string | null;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
  size_bytes: number | null;
  mime_type?: string | null;
  caption?: string | null;
  alt_text?: string | null;
  url_expires_at?: string | null;
}

export interface MediaCategory {
  id: string;
  slug: string;
  name: string;
  position: number;
  item_count?: number;
}

export interface MediaTeamRef {
  /**
   * Nullable: `serializeMatch` on the backend emits team *names and logos* but
   * no team ids, so an item's embedded match ref has none. Only the raw
   * `matches` row (archive, `/matches/:id`) carries `home_team_id`.
   */
  id: number | null;
  name: string;
  logo: string | null;
}

/** `matches.id` is the API-Football fixture id (see the plan's decisions table). */
export interface MediaMatchRef {
  id: number;
  home: MediaTeamRef;
  away: MediaTeamRef;
  kickoff_at: string | null;
  status_short: string | null;
  status_long: string | null;
  goals_home: number | null;
  goals_away: number | null;
  league: { id: number | null; name: string | null; logo: string | null; season: number | null } | null;
  /** Absent from `serializeMatch`; only the raw `matches` row has venue columns. */
  venue?: { id: number | null; name: string | null; city: string | null } | null;
  slug?: string | null;
  opponent_name?: string | null;
  opponent_logo?: string | null;
  is_home?: boolean | null;
}

export interface MediaContributorRef {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface MediaItem {
  id: string;
  type: MediaItemType;
  title: string | null;
  description: string | null;
  access_level: MediaAccessLevel;
  /**
   * Server-enforced. When true the payload is the teaser projection: cover and
   * copy only, `assets` empty. Never derive this client-side from access_level.
   */
  locked: boolean;
  category: MediaCategory | null;
  match_id: number | null;
  match: MediaMatchRef | null;
  phase: MediaPhase | null;
  published_at: string | null;
  expires_at: string | null;
  cover_url: string | null;
  cover_blurhash: string | null;
  /** Derived from the first video asset — the item row itself has no duration. */
  duration_ms: number | null;
  asset_count: number;
  /**
   * **Optional on purpose.** A teaser (every list response, and the detail
   * response for a locked item) has no `assets` key at all — see
   * `serializers.teaser`. `normaliseItem` fills in `[]`, but the type stays
   * optional so nothing can call `.find()` on a raw payload without a guard.
   */
  assets?: MediaAsset[];
  /** Flattened from the wire's `tags: [{ id, slug, name, kind }]`. */
  tags: string[];
  caption: string | null;
  contributor: MediaContributorRef | null;
  like_count: number;
  comment_count: number;
  view_count: number;
  share_count: number;
  save_count: number;
  story_view_count: number;
  liked_by_me: boolean;
  saved_by_me: boolean;
  /** Why the server locked it: login_required | premium_required | tier_required | … */
  lock_reason: string | null;
  comments_enabled: boolean;
  video_format: string | null;
  required_tiers: string[];
  deep_link: string | null;
  /** Stories only. */
  viewed?: boolean;
  share_url?: string | null;
  web_url?: string | null;
}

/**
 * A story rail entry: one match's worth of active stories.
 *
 * **Client-side only.** The backend has no group concept — `GET /stories`
 * returns a flat `{ items, nextCursor }` of story teasers — so
 * `groupStoriesByMatch` builds these from `item.match.id` (contract addendum,
 * "Stories"). `id` is therefore the fixture id as a string, or `'all'`.
 */
export interface MediaStoryGroup {
  id: string;
  title: string | null;
  cover_url: string | null;
  cover_blurhash: string | null;
  viewed: boolean;
  items: MediaItem[];
}

export interface MediaHomePayload {
  featured: MediaItem[];
  from_madrid_now: { match: MediaMatchRef | null; items: MediaItem[] } | null;
  latest: MediaItem[];
  stories: MediaStoryGroup[];
  categories: MediaCategory[];
  live_match?: MediaMatchRef | null;
}

/** Every consumer list endpoint uses this keyset envelope. */
export interface MediaListPage {
  items: MediaItem[];
  nextCursor: string | null;
}

export interface MediaMatchPage {
  match: MediaMatchRef | null;
  items: MediaItem[];
  nextCursor: string | null;
  pinned: MediaItem[];
  phase_counts: Partial<Record<MediaPhase, number>>;
}

export interface MediaTimelinePayload {
  match: MediaMatchRef | null;
  items: MediaItem[];
  nextCursor: string | null;
  is_live: boolean;
}

export interface MediaArchiveEntry {
  match: MediaMatchRef;
  media_count: number;
  /** §21's card reads "54 Photos · 12 Videos · 8 Stories", not "74 items". */
  type_counts: Record<MediaItemType, number>;
  cover_items: MediaItem[];
}

export interface MediaArchivePage {
  matches: MediaArchiveEntry[];
  nextCursor: string | null;
}

export interface MediaArchiveFilters {
  seasons: number[];
  leagues: { id: number; name: string; logo: string | null }[];
  opponents: MediaTeamRef[];
  /** Only the types that exist somewhere in the archive. */
  types: { type: MediaItemType; count: number }[];
}

/**
 * `GET /casa-media/search/filters` — the option lists behind §22's filter row.
 *
 * A superset of the archive facets: the backend reuses them and adds
 * contributors and the media types a consumer can search for.
 */
export interface MediaSearchFilterOptions extends MediaArchiveFilters {
  media_types: MediaItemType[];
  contributors: { id: string; display_name: string | null }[];
}

export interface MediaPlaybackAsset {
  id: string;
  url: string | null;
  hls_url: string | null;
  thumbnail_url: string | null;
  url_expires_at?: string | null;
}

/**
 * `POST /items/:id/playback` answers `{ assets }` and nothing else; `item_id` is
 * filled in by the normaliser from the id we asked for, and `expires_at` from
 * the assets' own `url_expires_at` when the signer supplied one.
 */
export interface MediaPlayback {
  item_id: string;
  expires_at: string | null;
  assets: MediaPlaybackAsset[];
}

/** Collections addressable by `app/media/list/[collection].tsx`. */
export const MEDIA_COLLECTIONS = [
  'all',
  'videos',
  'photos',
  'stories',
  'galleries',
  'exclusive',
  'trending',
  'latest-match',
] as const;

export type MediaCollection = (typeof MEDIA_COLLECTIONS)[number];

export function isMediaCollection(value: string): value is MediaCollection {
  return (MEDIA_COLLECTIONS as readonly string[]).includes(value);
}

export type MediaShareChannel = 'community' | 'copy_link' | 'external';

/**
 * The server's event vocabulary — `eventService.EVENT_TYPES`, verbatim. An
 * event whose `event_type` is not in this list is dropped silently by
 * `normaliseEvent`, so this list is the contract.
 */
export const MEDIA_EVENT_TYPES = [
  'item_impression',
  'item_view',
  'locked_view',
  'cta_click',
  'video_start',
  'video_progress',
  'video_complete',
  'like',
  'unlike',
  'comment',
  'share',
  'save',
  'unsave',
  'story_view',
  'story_reaction',
  'push_open',
  'search',
  'signup_attributed',
] as const;

export type MediaEventType = (typeof MEDIA_EVENT_TYPES)[number];

/**
 * The names call sites use. Two of them are legacy spellings that the wire does
 * not accept; `services/media/wire.ts#toEventType` maps them
 * (`signup_cta_click → cta_click`, `share_click → share`).
 */
export type MediaEventName = MediaEventType | 'signup_cta_click' | 'share_click';

/**
 * Which surface the user came from — `eventService.EVENT_SOURCES`, verbatim.
 *
 * Without this, "Community teaser → Media" (§41) and every per-surface question
 * are unanswerable from the data as stored: an `item_view` records that an item
 * was opened but not what led there. An unrecognised value is dropped
 * server-side, so this list is the contract.
 */
export const MEDIA_SURFACES = [
  'home',
  'community',
  'match',
  'search',
  'archive',
  'story',
  'push',
  'deeplink',
  'media',
] as const;

export type MediaSurface = (typeof MEDIA_SURFACES)[number];

export function isMediaSurface(value: unknown): value is MediaSurface {
  return (
    typeof value === 'string' && (MEDIA_SURFACES as readonly string[]).includes(value)
  );
}

/** One queued event, already in wire shape — the key is `event_type`. */
export interface MediaAnalyticsEvent {
  event_type: MediaEventType;
  item_id?: string;
  match_id?: number;
  campaign_id?: string;
  anon_id?: string;
  session_id?: string;
  surface?: MediaSurface;
  occurred_at: string;
  props?: Record<string, string | number | boolean | null>;
}
