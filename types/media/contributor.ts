/**
 * Contributor-side Casa Media wire types (plan §4.2, contributor block).
 *
 * The contributor endpoints return the *editorial* representation, not the
 * consumer one: raw `media_items` columns (`match_phase`, `short_description`,
 * `cover_url`) rather than the teaser projection in `casaMedia.ts`, and lists
 * come back as `{ data, total, page, limit }` rather than
 * `{ items, nextCursor }`. Keeping the two families in separate files is what
 * stops a consumer component being handed an editorial row by accident.
 */

import type { MediaAccessLevel, MediaPhase } from './casaMedia';

/* ------------------------------------------------------------------ */
/* Item                                                                */
/* ------------------------------------------------------------------ */

/**
 * Every status `media_items.status` may hold.
 *
 * The brief lists `expired`; the schema's CHECK constraint lists
 * `changes_requested`. Both are carried here so neither a schema change nor an
 * older server can produce a status the badge cannot render — `statusTone()`
 * falls back to neutral for anything unknown anyway.
 */
export const CONTRIBUTOR_ITEM_STATUSES = [
  'draft',
  'pending_review',
  'changes_requested',
  'approved',
  'scheduled',
  'published',
  'rejected',
  'archived',
  'removed',
  'expired',
] as const;

export type ContributorItemStatus = (typeof CONTRIBUTOR_ITEM_STATUSES)[number];

/** Statuses a contributor may still edit (the server enforces the same set). */
export const EDITABLE_STATUSES: readonly ContributorItemStatus[] = [
  'draft',
  'changes_requested',
  'rejected',
];

export function isEditableStatus(status: string | null | undefined): boolean {
  return EDITABLE_STATUSES.includes(status as ContributorItemStatus);
}

/**
 * Item types a contributor may create from the app.
 *
 * The schema allows `update | live | audio | interview` too, but there is no
 * mobile capture path for them — they are desk formats, created in the admin.
 */
export const CONTRIBUTOR_ITEM_TYPES = ['photo', 'video', 'gallery', 'story'] as const;

export type ContributorItemType = (typeof CONTRIBUTOR_ITEM_TYPES)[number];

export type ContributorAssetKind = 'image' | 'video';
export type ContributorAssetRole = 'content' | 'cover';

export type ContributorAssetStatus =
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'failed';

/** `GET …/items/:id/assets/:assetId` and the embedded `assets[]` on an item. */
export interface ContributorAsset {
  id: string;
  kind: ContributorAssetKind;
  role: ContributorAssetRole | string;
  position: number;
  status: ContributorAssetStatus | null;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
  blurhash: string | null;
  thumbnail_url: string | null;
  mime_type: string | null;
  url?: string | null;
  hls_url?: string | null;
  caption?: string | null;
  alt_text?: string | null;
  error?: string | null;
}

/**
 * The editorial match row. Flat, unlike the consumer `MediaMatchRef` — the
 * contributor endpoints hand back `matches` columns directly.
 */
export interface ContributorMatch {
  id: number;
  slug?: string | null;
  season?: number | null;
  league_id?: number | null;
  league_name?: string | null;
  league_logo?: string | null;
  kickoff_at: string | null;
  status_short?: string | null;
  home_team_name?: string | null;
  home_team_logo?: string | null;
  away_team_name?: string | null;
  away_team_logo?: string | null;
  home_goals?: number | null;
  away_goals?: number | null;
  is_home?: boolean | null;
  opponent_name?: string | null;
  opponent_logo?: string | null;
}

export interface ContributorCategory {
  id: string;
  slug: string;
  name: string;
  name_ar?: string | null;
  icon?: string | null;
  color?: string | null;
  default_phase?: MediaPhase | null;
}

export interface ContributorItem {
  id: string;
  type: ContributorItemType | string;
  status: ContributorItemStatus | string;
  title: string | null;
  short_description: string | null;
  caption: string | null;
  language?: string | null;
  match_id: number | null;
  match: ContributorMatch | null;
  match_phase: MediaPhase | null;
  category_id: string | null;
  category: ContributorCategory | null;
  access_level: MediaAccessLevel | 'internal';
  cover_url: string | null;
  cover_blurhash: string | null;
  publish_at: string | null;
  published_at: string | null;
  expires_at?: string | null;
  submitted_at?: string | null;
  review_note?: string | null;
  notify_mode?: MediaNotifyMode | null;
  asset_count: number;
  assets: ContributorAsset[];
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  created_at?: string | null;
  updated_at?: string | null;
  web_url?: string | null;
  deep_link?: string | null;
  tags?: { id: string; slug: string; name: string }[] | string[];
}

export type MediaNotifyMode = 'none' | 'now' | 'digest' | 'scheduled';

/** Body of `POST /contributor/items` and `PATCH /contributor/items/:id`. */
export interface ContributorItemInput {
  type?: ContributorItemType;
  match_id?: number;
  match_phase?: MediaPhase | null;
  category_id?: string | null;
  title?: string | null;
  short_description?: string | null;
  caption?: string | null;
  access_level?: MediaAccessLevel;
  tags?: string[];
}

/* ------------------------------------------------------------------ */
/* Upload slots                                                        */
/* ------------------------------------------------------------------ */

export type UploadProvider = 'supabase' | 'cloudflare_stream';

/**
 * `POST …/assets` and `POST …/assets/:assetId/retry` return the same envelope.
 * A retry keeps the SAME `assetId` — that is the whole point of the endpoint,
 * and it is why the upload queue never mints a new asset row on a retry.
 */
export interface UploadSlot {
  assetId: string;
  provider: UploadProvider;
  uploadUrl: string;
  method: 'PUT' | 'POST';
  expiresAt?: string | null;
  thumbnailUploadUrl?: string | null;
  tusEndpoint?: string | null;
}

export interface CompleteUploadMeta {
  width?: number | null;
  height?: number | null;
  size_bytes?: number | null;
  blurhash?: string | null;
  mime_type?: string | null;
  duration_ms?: number | null;
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export type ContributorStatus = 'invited' | 'active' | 'suspended' | 'deactivated';

export interface ContributorProfile {
  user_id: string;
  status: ContributorStatus | string;
  display_name: string | null;
  bio?: string | null;
  requires_approval: boolean;
  allowed_match_ids?: number[] | null;
  allowed_category_ids?: string[] | null;
  max_access_level?: MediaAccessLevel | 'internal' | null;
}

/**
 * Upload ceilings, already normalised to camelCase numbers.
 *
 * The server expresses these as `app_settings` rows keyed
 * `media.max_video_duration_sec` &c.; `ContributorMediaService.getMe` folds
 * every spelling it might see into this one shape so no screen has to guess.
 */
export interface ContributorLimits {
  maxVideoDurationSec: number;
  maxVideoBytes: number;
  maxImageBytes: number;
  maxGalleryAssets: number;
}

export interface ContributorMe {
  contributor: ContributorProfile | null;
  isMediaManager: boolean;
  permissions: string[];
  allowedMatches: ContributorMatch[];
  allowedCategories: ContributorCategory[];
  todayMatch: ContributorMatch | null;
  limits: ContributorLimits;
  requiresApproval: boolean;
  maxAccessLevel: MediaAccessLevel | 'internal' | null;
}

/* ------------------------------------------------------------------ */
/* Lists & stats                                                       */
/* ------------------------------------------------------------------ */

/** The editorial list envelope. Page-numbered, unlike the consumer keyset. */
export interface ContributorPage<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ContributorStatTotals {
  impressions: number;
  views: number;
  unique_viewers: number;
  locked_views: number;
  cta_clicks: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  video_starts: number;
  video_p50: number;
  video_completes: number;
  story_views: number;
  push_opens: number;
  signups_attributed: number;
  returns_after_lock: number;
}

export interface ContributorItemStats {
  item_id: string;
  range: { from: string; to: string };
  totals: Partial<ContributorStatTotals>;
  live: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    story_views: number;
  } | null;
  series: Record<string, unknown>[];
}

export interface ContributorStats {
  contributor_id: string;
  range: { from: string; to: string };
  published_items: number;
  totals: Partial<ContributorStatTotals>;
  series: Record<string, unknown>[];
}

export interface SubmitItemInput {
  publish_now?: boolean;
  publish_at?: string | null;
  notify_mode?: MediaNotifyMode;
  publish_when_ready?: boolean;
}
