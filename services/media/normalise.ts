/**
 * The one place the Casa Media wire shape is translated into the shape the app
 * consumes.
 *
 * `backend/services/casaMedia/serializers.js` is the source of truth, and it
 * does NOT send what the screens want: the cover is nested (`cover.url`), the
 * counters are nested (`counts.likes`), the viewer's own state is nested
 * (`viewer.liked`), the description is `short_description`, the phase is
 * `match_phase`, the match reference is a flat bag of `home_team_name` /
 * `home_goals` columns, tags are objects, and a *teaser* carries no `assets`
 * key at all. Per the contract addendum the mobile app normalises at the service
 * boundary rather than asking the backend to flatten, so every read in
 * `CasaMediaService` funnels through this module and nothing downstream —
 * hooks, cache walker, components — ever sees a wire field.
 *
 * Two shapes of match arrive and both are handled here: the item-embedded ref
 * from `serializeMatch` (names and logos, no team ids, no venue) and the raw
 * `matches` row returned by `/archive`, `/matches/:id` and `home.live_match`
 * (which additionally has `home_team_id`, `venue_name`, `status_long`, `season`).
 *
 * Pure — no React Native, no axios, no `@/` imports at runtime — so
 * `utils/__tests__/contract.test.mts` can run it under `node --test` against
 * recorded backend payloads.
 */
import type {
  MediaArchiveEntry,
  MediaArchiveFilters,
  MediaArchivePage,
  MediaAsset,
  MediaCategory,
  MediaHomePayload,
  MediaItem,
  MediaListPage,
  MediaMatchPage,
  MediaMatchRef,
  MediaPhase,
  MediaPlayback,
  MediaStoryGroup,
  MediaTimelinePayload,
} from '../../types/media/casaMedia';

/** Anything off the wire. Deliberately loose: the whole job here is to not trust it. */
type Wire = Record<string, any>;

const asRecord = (value: unknown): Wire => (value && typeof value === 'object' ? (value as Wire) : {});

const asArray = (value: unknown): Wire[] => (Array.isArray(value) ? value.filter(Boolean) : []);

const num = (value: unknown): number | null => {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

const count = (value: unknown): number => num(value) ?? 0;

const str = (value: unknown): string | null => (typeof value === 'string' ? value : null);

/* ------------------------------------------------------------------ */
/* Assets                                                              */
/* ------------------------------------------------------------------ */

/**
 * `serializeAsset` omits `item_id` and only emits `url` / `hls_url` keys when
 * the signer actually resolved them — "absent" and "signed to null" are
 * different states on the wire, and both mean `null` here.
 */
export function normaliseAsset(raw: unknown, itemId = ''): MediaAsset {
  const a = asRecord(raw);
  return {
    id: String(a.id ?? ''),
    item_id: String(a.item_id ?? itemId),
    kind: a.kind === 'video' ? 'video' : 'image',
    role: str(a.role) ?? 'content',
    position: count(a.position),
    status: (a.status ?? 'ready') as MediaAsset['status'],
    url: str(a.url),
    hls_url: str(a.hls_url),
    thumbnail_url: str(a.thumbnail_url),
    blurhash: str(a.blurhash),
    width: num(a.width),
    height: num(a.height),
    duration_ms: num(a.duration_ms),
    size_bytes: num(a.size_bytes),
    mime_type: str(a.mime_type),
    caption: str(a.caption),
    alt_text: str(a.alt_text),
    url_expires_at: str(a.url_expires_at),
  };
}

/* ------------------------------------------------------------------ */
/* Matches                                                             */
/* ------------------------------------------------------------------ */

/**
 * Flat wire match → the nested `home` / `away` / `league` shape the match
 * components already read. `venue` stays undefined for the item-embedded ref,
 * which genuinely has no venue columns.
 */
export function normaliseMatch(raw: unknown): MediaMatchRef | null {
  const m = asRecord(raw);
  const id = num(m.id);
  if (id === null) return null;

  const leagueId = num(m.league_id);
  const leagueName = str(m.league_name);
  const venueName = str(m.venue_name);

  return {
    id,
    home: {
      id: num(m.home_team_id),
      name: str(m.home_team_name) ?? '',
      logo: str(m.home_team_logo),
    },
    away: {
      id: num(m.away_team_id),
      name: str(m.away_team_name) ?? '',
      logo: str(m.away_team_logo),
    },
    kickoff_at: str(m.kickoff_at),
    status_short: str(m.status_short),
    status_long: str(m.status_long),
    goals_home: num(m.home_goals),
    goals_away: num(m.away_goals),
    league:
      leagueId !== null || leagueName
        ? { id: leagueId, name: leagueName, logo: str(m.league_logo), season: num(m.season) }
        : null,
    venue: venueName ? { id: null, name: venueName, city: str(m.venue_city) } : undefined,
    slug: str(m.slug),
    opponent_name: str(m.opponent_name),
    opponent_logo: str(m.opponent_logo),
    is_home: typeof m.is_home === 'boolean' ? m.is_home : null,
  };
}

/** `"Real Madrid vs Barcelona"` — the story-group label from the addendum. */
export function matchTitle(match: MediaMatchRef | null): string | null {
  if (!match) return null;
  const home = match.home.name || '';
  const away = match.away.name || '';
  if (!home && !away) return null;
  return `${home} vs ${away}`.trim();
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export function normaliseCategory(raw: unknown): MediaCategory | null {
  const c = asRecord(raw);
  if (!c.id && !c.slug) return null;
  return {
    id: String(c.id ?? c.slug),
    slug: String(c.slug ?? c.id),
    name: str(c.name) ?? '',
    position: count(c.position),
    item_count: num(c.item_count) ?? undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Items                                                               */
/* ------------------------------------------------------------------ */

const PHASES = new Set<string>([
  'pre_match',
  'arrival',
  'inside_stadium',
  'match_window',
  'full_time',
  'post_match',
]);

function normalisePhase(value: unknown): MediaPhase | null {
  return typeof value === 'string' && PHASES.has(value) ? (value as MediaPhase) : null;
}

/**
 * Teaser **or** full item → `MediaItem`.
 *
 * The teaser/full distinction is not a flag on the payload, it is the absence
 * of the `assets`, `caption` and `tags` keys. `assets` therefore normalises to
 * `[]` rather than staying undefined, which is what stops `item.assets.find()`
 * from throwing on a locked item.
 */
export function normaliseItem(raw: unknown): MediaItem {
  const i = asRecord(raw);
  const cover = asRecord(i.cover);
  const counts = asRecord(i.counts);
  const viewer = asRecord(i.viewer);
  const id = String(i.id ?? '');
  const assets = asArray(i.assets).map((asset) => normaliseAsset(asset, id));
  const match = normaliseMatch(i.match);

  return {
    id,
    type: (i.type ?? 'photo') as MediaItem['type'],
    title: str(i.title),
    // `short_description` on the wire; every screen says `description`.
    description: str(i.short_description) ?? str(i.description),
    caption: str(i.caption),
    access_level: (i.access_level ?? 'public') as MediaItem['access_level'],
    // Server-enforced and never derived from access_level — a public item can
    // still be locked (geo, expiry) and a premium one unlocked for a subscriber.
    locked: !!i.locked,
    lock_reason: str(i.lock_reason),
    category: normaliseCategory(i.category),
    match_id: match?.id ?? num(i.match_id),
    match,
    phase: normalisePhase(i.match_phase ?? i.phase),
    published_at: str(i.published_at),
    expires_at: str(i.expires_at),
    cover_url: str(cover.url) ?? str(i.cover_url),
    cover_blurhash: str(cover.blurhash) ?? str(i.cover_blurhash),
    // No duration on the item row: take the first video asset that has one.
    duration_ms: assets.reduce<number | null>(
      (found, asset) => found ?? (asset.kind === 'video' ? asset.duration_ms : null),
      null,
    ),
    asset_count: count(i.asset_count),
    assets,
    tags: asArray(i.tags)
      .map((tag) => (typeof tag === 'string' ? tag : str(tag.slug) ?? str(tag.name)))
      .filter((tag): tag is string => !!tag),
    contributor: i.contributor
      ? {
          id: String(asRecord(i.contributor).id ?? ''),
          display_name: str(asRecord(i.contributor).display_name),
          // Not on the consumer wire; the contributor serializer emits id + name only.
          avatar_url: str(asRecord(i.contributor).avatar_url),
        }
      : null,
    view_count: count(counts.views ?? i.view_count),
    like_count: count(counts.likes ?? i.like_count),
    comment_count: count(counts.comments ?? i.comment_count),
    share_count: count(counts.shares ?? i.share_count),
    save_count: count(counts.saves ?? i.save_count),
    story_view_count: count(counts.story_views ?? i.story_view_count),
    liked_by_me: !!(viewer.liked ?? i.liked_by_me),
    saved_by_me: !!(viewer.saved ?? i.saved_by_me),
    comments_enabled: i.comments_enabled !== false,
    video_format: str(i.video_format),
    required_tiers: (Array.isArray(i.required_tiers) ? i.required_tiers : []).filter(
      (tier: unknown): tier is string => typeof tier === 'string',
    ),
    deep_link: str(i.deep_link),
    web_url: str(i.web_url),
    ...(i.viewed === undefined ? {} : { viewed: !!i.viewed }),
  };
}

export function normaliseItems(raw: unknown): MediaItem[] {
  return asArray(raw).map(normaliseItem);
}

/* ------------------------------------------------------------------ */
/* Envelopes                                                           */
/* ------------------------------------------------------------------ */

/** `{ items, nextCursor }` — every consumer list, including `/stories`. */
export function normaliseList(raw: unknown): MediaListPage {
  const page = asRecord(raw);
  return { items: normaliseItems(page.items), nextCursor: str(page.nextCursor) };
}

/** `GET /categories` → `{ items, nextCursor }`, not `{ categories }`. */
export function normaliseCategories(raw: unknown): MediaCategory[] {
  const page = asRecord(raw);
  const rows = Array.isArray(raw) ? raw : (page.items ?? page.categories);
  return asArray(rows)
    .map(normaliseCategory)
    .filter((category): category is MediaCategory => !!category);
}

export function normaliseHome(raw: unknown): MediaHomePayload {
  const home = asRecord(raw);
  const now = asRecord(home.from_madrid_now);
  return {
    featured: normaliseItems(home.featured),
    from_madrid_now: home.from_madrid_now
      ? { match: normaliseMatch(now.match), items: normaliseItems(now.items) }
      : null,
    latest: normaliseItems(home.latest),
    // The hub rail wants groups; the wire sends a flat list of story teasers.
    stories: groupStoriesByMatch(normaliseItems(home.stories)),
    categories: asArray(home.categories)
      .map(normaliseCategory)
      .filter((category): category is MediaCategory => !!category),
    live_match: normaliseMatch(home.live_match),
  };
}

export function normaliseMatchPage(raw: unknown): MediaMatchPage {
  const page = asRecord(raw);
  return {
    match: normaliseMatch(page.match),
    items: normaliseItems(page.items),
    nextCursor: str(page.nextCursor),
    pinned: normaliseItems(page.pinned),
    phase_counts: asRecord(page.phase_counts) as MediaMatchPage['phase_counts'],
  };
}

/** `GET /matches/:id/from-madrid-now` → `{ match, items, nextCursor, is_live }`. */
export function normaliseTimeline(raw: unknown): MediaTimelinePayload {
  const page = asRecord(raw);
  return {
    match: normaliseMatch(page.match),
    items: normaliseItems(page.items),
    nextCursor: str(page.nextCursor),
    is_live: !!page.is_live,
  };
}

export function normaliseArchive(raw: unknown): MediaArchivePage {
  const page = asRecord(raw);
  const matches: MediaArchiveEntry[] = [];
  for (const row of asArray(page.matches)) {
    const entry = asRecord(row);
    const match = normaliseMatch(entry.match);
    if (!match) continue;
    matches.push({
      match,
      media_count: count(entry.media_count),
      cover_items: normaliseItems(entry.cover_items),
    });
  }
  return { matches, nextCursor: str(page.nextCursor) };
}

export function normaliseArchiveFilters(raw: unknown): MediaArchiveFilters {
  const f = asRecord(raw);
  return {
    seasons: asArray(f.seasons)
      .map((season) => num(season))
      .filter((season): season is number => season !== null),
    leagues: asArray(f.leagues).map((league) => ({
      id: count(league.id),
      name: str(league.name) ?? '',
      logo: str(league.logo),
    })),
    opponents: asArray(f.opponents).map((team) => ({
      id: num(team.id),
      name: str(team.name) ?? '',
      logo: str(team.logo),
    })),
  };
}

/** `POST /items/:id/playback` → `{ assets }`; the item id comes from the caller. */
export function normalisePlayback(raw: unknown, itemId: string): MediaPlayback {
  const assets = asArray(asRecord(raw).assets).map((asset) => normaliseAsset(asset, itemId));
  return {
    item_id: itemId,
    // Earliest expiry wins: the whole set goes stale when the first URL does.
    expires_at: assets.reduce<string | null>(
      (soonest, asset) =>
        asset.url_expires_at && (!soonest || asset.url_expires_at < soonest)
          ? asset.url_expires_at
          : soonest,
      null,
    ),
    assets: assets.map((asset) => ({
      id: asset.id,
      url: asset.url,
      hls_url: asset.hls_url,
      thumbnail_url: asset.thumbnail_url,
      url_expires_at: asset.url_expires_at,
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Stories                                                             */
/* ------------------------------------------------------------------ */

/**
 * The "everything" bubble — `/media/story/all` collapses every active story
 * into one group. It is a *sentinel route*, never a real group id.
 */
export const ALL_STORIES_GROUP = 'all';

/**
 * Stories with no fixture attached. Deliberately NOT `all`: colliding with the
 * sentinel would make `/media/story/all` open the handful of match-less stories
 * instead of every story, and would put a bubble on the rail that silently
 * hijacks the "see everything" route.
 */
export const NO_MATCH_STORIES_GROUP = 'no-match';

/**
 * Build the story rail's bubbles from a flat list of story teasers.
 *
 * The backend has no group concept (contract addendum, "Stories"), so one
 * bubble per fixture, newest group first, cover taken from the newest item in
 * the group, and `viewed` true only when every item in it is viewed. Items
 * arrive newest-first from `listPublished`, which is the order the viewer pages
 * through, so the grouping preserves it.
 */
export function groupStoriesByMatch(items: MediaItem[]): MediaStoryGroup[] {
  const groups = new Map<string, MediaStoryGroup>();

  for (const item of items) {
    const key = item.match?.id != null ? String(item.match.id) : NO_MATCH_STORIES_GROUP;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
      existing.viewed = existing.viewed && !!item.viewed;
      continue;
    }
    groups.set(key, {
      id: key,
      title: matchTitle(item.match) ?? item.title,
      cover_url: item.cover_url,
      cover_blurhash: item.cover_blurhash,
      viewed: !!item.viewed,
      items: [item],
    });
  }

  return [...groups.values()];
}

/**
 * The `all` bubble: every active story as one group, so `/media/story/all`
 * pages through the whole set rather than a single fixture.
 */
export function allStoriesGroup(items: MediaItem[]): MediaStoryGroup | null {
  if (!items.length) return null;
  return {
    id: ALL_STORIES_GROUP,
    title: null,
    cover_url: items[0].cover_url,
    cover_blurhash: items[0].cover_blurhash,
    viewed: items.every((item) => !!item.viewed),
    items,
  };
}

/* ------------------------------------------------------------------ */
/* Comments                                                            */
/* ------------------------------------------------------------------ */

export interface NormalisedCommentsPage {
  comments: Wire[];
  nextCursor: string | null;
  /** `GET /items/:id/comments` answers `{ items: [], nextCursor: null, locked: true }`. */
  locked: boolean;
}

/**
 * The media comment envelope is `{ items, nextCursor, locked? }` — `items`, not
 * `comments`, and the rows carry `item_id` where the shared `Comment` type says
 * `post_id`.
 */
export function normaliseCommentsPage(raw: unknown, targetId: string): NormalisedCommentsPage {
  const page = asRecord(raw);
  const rows = asArray(page.items ?? page.comments);
  return {
    comments: rows.map((row) => ({ ...row, post_id: row.post_id ?? row.item_id ?? targetId })),
    nextCursor: str(page.nextCursor),
    locked: !!page.locked,
  };
}
