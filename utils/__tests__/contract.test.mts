/**
 * Recorded-response contract test for Casa Media.
 *
 * Every fixture below is transcribed from the backend that actually serves it —
 * `services/casaMedia/serializers.js` for items, matches and assets, and the
 * controllers for the envelopes around them. They are checked in as literals on
 * purpose: the bug this file exists to prevent is the mobile app being written
 * against an *invented* response shape, which no amount of self-consistent
 * mocking catches. If the backend changes a key, update the fixture here and
 * the failure tells you exactly which screens move.
 *
 * The three things that must never regress:
 *   1. a teaser has NO `assets` key   → `normaliseItem` still yields `[]`
 *   2. nested wire fields (`cover.url`, `counts.likes`, `viewer.liked`,
 *      `short_description`, `match_phase`, flat match ref) reach the UI as the
 *      flat names every component reads
 *   3. outbound bodies use `event_type` and `expo_push_token`
 *
 * Run with:  node --test utils/__tests__/contract.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  allStoriesGroup,
  groupStoriesByMatch,
  matchTitle,
  normaliseArchive,
  normaliseCategories,
  normaliseCommentsPage,
  normaliseHome,
  normaliseItem,
  normaliseList,
  normaliseMatch,
  normaliseMatchPage,
  normalisePlayback,
  normaliseTimeline,
} from '../../services/media/normalise.ts';
import {
  buildDeviceBody,
  buildEventsBody,
  pickSignedWidth,
  toEventType,
} from '../../services/media/wire.ts';
import { normaliseMe } from '../../services/media/contributorMe.ts';
import { transformCover } from '../mediaUrl.core.ts';

/* ================================================================== */
/* Recorded fixtures                                                   */
/* ================================================================== */

/** `serializeMatch(item.match)` — flat, no team ids, no venue, no status_long. */
const WIRE_MATCH_REF = {
  id: 1035041,
  slug: 'real-madrid-vs-fc-barcelona-1035041',
  kickoff_at: '2026-03-14T20:00:00.000Z',
  status_short: '2H',
  league_name: 'La Liga',
  league_logo: 'https://media.api-sports.io/football/leagues/140.png',
  home_team_name: 'Real Madrid',
  home_team_logo: 'https://media.api-sports.io/football/teams/541.png',
  away_team_name: 'FC Barcelona',
  away_team_logo: 'https://media.api-sports.io/football/teams/529.png',
  home_goals: 2,
  away_goals: 1,
  is_home: true,
  opponent_name: 'FC Barcelona',
  opponent_logo: 'https://media.api-sports.io/football/teams/529.png',
};

/** The raw `matches` row, as `/archive`, `/matches/:id` and `home.live_match` send it. */
const WIRE_MATCH_ROW = {
  id: 1035041,
  season: 2025,
  league_id: 140,
  league_name: 'La Liga',
  league_logo: 'https://media.api-sports.io/football/leagues/140.png',
  league_round: 'Regular Season - 28',
  kickoff_at: '2026-03-14T20:00:00.000Z',
  venue_name: 'Santiago Bernabéu',
  venue_city: 'Madrid',
  status_short: 'FT',
  status_long: 'Match Finished',
  elapsed_min: 90,
  home_team_id: 541,
  home_team_name: 'Real Madrid',
  home_team_logo: 'https://media.api-sports.io/football/teams/541.png',
  away_team_id: 529,
  away_team_name: 'FC Barcelona',
  away_team_logo: 'https://media.api-sports.io/football/teams/529.png',
  home_goals: 3,
  away_goals: 1,
  is_home: true,
  opponent_team_id: 529,
  opponent_name: 'FC Barcelona',
  opponent_logo: 'https://media.api-sports.io/football/teams/529.png',
  slug: 'real-madrid-vs-fc-barcelona-1035041',
  media_count: 42,
};

/** `serializers.teaser(item, { access: allowed, viewerState })`. Note: no `assets`. */
const WIRE_TEASER = {
  id: '11111111-2222-4333-8444-555555555555',
  type: 'gallery',
  video_format: null,
  status: 'published',
  title: 'Warm-up at the Bernabéu',
  short_description: 'Ten minutes before kickoff.',
  language: 'en',
  match_phase: 'pre_match',
  match: WIRE_MATCH_REF,
  category: {
    id: 'cccccccc-1111-4222-8333-444444444444',
    slug: 'behind-the-scenes',
    name: 'Behind the scenes',
    name_ar: 'خلف الكواليس',
    icon: 'camera',
    color: '#BC9045',
  },
  contributor: { id: 'uuuu-1111', display_name: 'Marta R.' },
  cover: {
    url: 'https://xyz.supabase.co/storage/v1/object/public/media-covers/a/cover.jpg',
    blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
    width: 1600,
    height: 900,
  },
  access_level: 'public',
  required_tiers: [],
  comments_enabled: true,
  published_at: '2026-03-14T19:50:00.000Z',
  expires_at: null,
  asset_count: 8,
  counts: { views: 1240, likes: 87, comments: 12, shares: 5, saves: 9, story_views: 0 },
  locked: false,
  lock_reason: null,
  viewer: { liked: true, saved: false },
  deep_link: 'casamadridistaapp://media/item/11111111-2222-4333-8444-555555555555',
  web_url: 'https://media.casamadridista.com/m/11111111-2222-4333-8444-555555555555',
};

/** `serializers.full(...)` — teaser plus caption, tags and signed assets. */
const WIRE_FULL = {
  ...WIRE_TEASER,
  caption: 'Shot on the touchline.',
  tags: [
    { id: 't1', slug: 'clasico', name: 'Clásico', kind: 'free' },
    { id: 't2', slug: 'bernabeu', name: 'Bernabéu', kind: 'venue' },
  ],
  assets: [
    {
      id: 'aaaa-0001',
      kind: 'video',
      role: 'content',
      position: 0,
      status: 'ready',
      width: 1920,
      height: 1080,
      duration_ms: 42_000,
      blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
      thumbnail_url: 'https://videodelivery.net/abc/thumbnails/thumbnail.jpg',
      mime_type: 'video/mp4',
      caption: null,
      alt_text: null,
      hls_url: 'https://videodelivery.net/abc/manifest/video.m3u8',
      url_expires_at: '2026-03-14T21:00:00.000Z',
    },
    {
      id: 'aaaa-0002',
      kind: 'image',
      role: 'content',
      position: 1,
      status: 'ready',
      width: 2048,
      height: 1365,
      duration_ms: null,
      blurhash: null,
      thumbnail_url: null,
      mime_type: 'image/jpeg',
      caption: null,
      alt_text: null,
      url: 'https://xyz.supabase.co/storage/v1/object/sign/media-private/a/2.jpg?token=xx',
      url_expires_at: '2026-03-14T20:30:00.000Z',
    },
  ],
};

/**
 * The teaser a *locked* item is served as — a 200, not a 403. `assets`,
 * `caption` and `tags` are absent, which is exactly what crashed
 * `item.assets.find(...)`.
 */
const WIRE_LOCKED_TEASER = {
  ...WIRE_TEASER,
  id: '99999999-2222-4333-8444-555555555555',
  access_level: 'premium',
  required_tiers: ['gold'],
  locked: true,
  lock_reason: 'premium_required',
  viewer: { liked: false, saved: false },
};

/** `GET /matches/:matchId`. */
const WIRE_MATCH_PAGE = {
  match: WIRE_MATCH_ROW,
  items: [WIRE_TEASER, WIRE_LOCKED_TEASER],
  nextCursor: 'eyJwdWJsaXNoZWRfYXQiOiIyMDI2LTAzLTE0In0=',
  phase_counts: {
    pre_match: 4,
    arrival: 2,
    inside_stadium: 6,
    match_window: 18,
    full_time: 7,
    post_match: 5,
    all: 42,
  },
  pinned: [WIRE_TEASER],
};

/** `GET /matches/:matchId/from-madrid-now`. */
const WIRE_FROM_MADRID_NOW = {
  match: WIRE_MATCH_ROW,
  items: [WIRE_TEASER],
  nextCursor: null,
  is_live: true,
};

/** `GET /stories` — a flat list of story teasers, each with `viewed`. */
const WIRE_STORIES = {
  items: [
    { ...WIRE_TEASER, id: 'story-a', type: 'story', viewed: false, match: WIRE_MATCH_REF },
    { ...WIRE_TEASER, id: 'story-b', type: 'story', viewed: true, match: WIRE_MATCH_REF },
    {
      ...WIRE_TEASER,
      id: 'story-c',
      type: 'story',
      viewed: true,
      match: { ...WIRE_MATCH_REF, id: 900001, away_team_name: 'Girona' },
    },
  ],
  nextCursor: null,
};

/** `GET /archive`. */
const WIRE_ARCHIVE = {
  matches: [{ match: WIRE_MATCH_ROW, media_count: 42, cover_items: [WIRE_TEASER] }],
  nextCursor: 'eyJraWNrb2ZmX2F0IjoiMjAyNi0wMy0xNCJ9',
};

/** `GET /items/:id/comments` — `items`, not `comments`; rows carry `item_id`. */
const WIRE_COMMENTS = {
  items: [
    {
      id: 'comment-1',
      item_id: WIRE_TEASER.id,
      author_id: 'uuuu-2222',
      parent_id: null,
      body: 'Unreal atmosphere.',
      status: 'approved',
      like_count: 3,
      created_at: '2026-03-14T20:05:00.000Z',
      author: { id: 'uuuu-2222', first_name: 'Ana', last_name: 'L', avatar_url: null },
    },
  ],
  nextCursor: null,
};

const WIRE_COMMENTS_LOCKED = { items: [], nextCursor: null, locked: true };

/** `GET /categories` — the same `{ items, nextCursor }` envelope as every list. */
const WIRE_CATEGORIES = {
  items: [
    {
      id: 'cccccccc-1111-4222-8333-444444444444',
      slug: 'behind-the-scenes',
      name: 'Behind the scenes',
      name_ar: 'خلف الكواليس',
      description: null,
      icon: 'camera',
      color: '#BC9045',
      position: 1,
      default_phase: 'pre_match',
    },
    {
      id: 'dddddddd-1111-4222-8333-444444444444',
      slug: 'match-day',
      name: 'Match day',
      name_ar: 'يوم المباراة',
      description: null,
      icon: 'trophy',
      color: '#FFFFFF',
      position: 2,
      default_phase: 'match_window',
    },
  ],
  nextCursor: null,
};

/** `GET /home`. `stories` is a flat list of teasers, not groups. */
const WIRE_HOME = {
  featured: [WIRE_TEASER],
  from_madrid_now: { match: WIRE_MATCH_ROW, items: [WIRE_TEASER] },
  latest: [WIRE_TEASER, WIRE_LOCKED_TEASER],
  stories: WIRE_STORIES.items,
  categories: WIRE_CATEGORIES.items,
  live_match: WIRE_MATCH_ROW,
};

/** `POST /items/:id/playback` — `{ assets }` and nothing else. */
const WIRE_PLAYBACK = { assets: WIRE_FULL.assets };

/** `GET /contributor/me` — camelCase contract plus the deprecated aliases. */
const WIRE_CONTRIBUTOR_ME = {
  userId: 'uuuu-1111',
  status: 'active',
  displayName: 'Marta R.',
  requiresApproval: false,
  maxAccessLevel: 'premium',
  allowedMatches: [WIRE_MATCH_ROW],
  allowedCategories: WIRE_CATEGORIES.items,
  todayMatch: WIRE_MATCH_ROW,
  limits: {
    maxVideoDurationSec: 600,
    maxVideoBytes: 209_715_200,
    maxImageBytes: 26_214_400,
    maxGalleryAssets: 60,
  },
  permissions: ['media:create', 'media:submit'],
  isMediaManager: false,
  // ---- deprecated aliases the backend still emits ----
  contributor: {
    user_id: 'uuuu-1111',
    status: 'active',
    display_name: 'Marta R.',
    requires_approval: false,
    max_access_level: 'registered',
  },
  is_media_manager: false,
  allowed_matches: [WIRE_MATCH_ROW],
  allowed_categories: WIRE_CATEGORIES.items,
  today_match: WIRE_MATCH_ROW,
};

/* ================================================================== */
/* Items                                                               */
/* ================================================================== */

describe('normaliseItem — teaser', () => {
  const item = normaliseItem(WIRE_TEASER);

  it('flattens cover.url and cover.blurhash', () => {
    assert.equal(item.cover_url, WIRE_TEASER.cover.url);
    assert.equal(item.cover_blurhash, WIRE_TEASER.cover.blurhash);
  });

  it('flattens counts.* to *_count', () => {
    assert.equal(item.like_count, 87);
    assert.equal(item.comment_count, 12);
    assert.equal(item.view_count, 1240);
    assert.equal(item.share_count, 5);
    assert.equal(item.save_count, 9);
    assert.equal(item.story_view_count, 0);
  });

  it('flattens viewer.liked / viewer.saved to liked_by_me / saved_by_me', () => {
    assert.equal(item.liked_by_me, true);
    assert.equal(item.saved_by_me, false);
  });

  it('reads short_description as description and match_phase as phase', () => {
    assert.equal(item.description, 'Ten minutes before kickoff.');
    assert.equal(item.phase, 'pre_match');
  });

  it('derives match_id from the embedded match ref', () => {
    assert.equal(item.match_id, 1035041);
    assert.equal(item.match?.id, 1035041);
  });

  it('carries the fields the UI needs beyond the counters', () => {
    assert.equal(item.comments_enabled, true);
    assert.equal(item.video_format, null);
    assert.deepEqual(item.required_tiers, []);
    assert.equal(item.deep_link, WIRE_TEASER.deep_link);
    assert.equal(item.web_url, WIRE_TEASER.web_url);
    assert.equal(item.lock_reason, null);
  });

  it('yields an empty assets array even though the wire has no assets key', () => {
    assert.equal('assets' in WIRE_TEASER, false);
    assert.deepEqual(item.assets, []);
    // The crash this replaces: `.find` on undefined.
    assert.doesNotThrow(() => (item.assets ?? []).find(() => true));
  });

  it('has no tags or caption on a teaser', () => {
    assert.deepEqual(item.tags, []);
    assert.equal(item.caption, null);
  });
});

describe('normaliseItem — full', () => {
  const item = normaliseItem(WIRE_FULL);

  it('flattens tag objects to their slugs', () => {
    assert.deepEqual(item.tags, ['clasico', 'bernabeu']);
  });

  it('keeps every asset and fills in item_id', () => {
    assert.equal(item.assets?.length, 2);
    assert.equal(item.assets?.[0].item_id, WIRE_FULL.id);
    assert.equal(item.assets?.[0].hls_url, WIRE_FULL.assets[0].hls_url);
    // `serializeAsset` omits `url` entirely when it was not signed.
    assert.equal(item.assets?.[0].url, null);
    assert.equal(item.assets?.[1].url, WIRE_FULL.assets[1].url);
  });

  it('derives duration_ms from the first video asset', () => {
    assert.equal(item.duration_ms, 42_000);
    assert.equal(normaliseItem(WIRE_TEASER).duration_ms, null);
  });

  it('keeps the caption', () => {
    assert.equal(item.caption, 'Shot on the touchline.');
  });
});

describe('normaliseItem — locked teaser', () => {
  const item = normaliseItem(WIRE_LOCKED_TEASER);

  it('keeps locked and lock_reason without inventing assets', () => {
    assert.equal(item.locked, true);
    assert.equal(item.lock_reason, 'premium_required');
    assert.deepEqual(item.assets, []);
    assert.deepEqual(item.required_tiers, ['gold']);
  });

  it('still exposes the cover, which is the whole point of a teaser', () => {
    assert.equal(item.cover_url, WIRE_TEASER.cover.url);
  });
});

/* ================================================================== */
/* Matches                                                             */
/* ================================================================== */

describe('normaliseMatch', () => {
  it('builds home/away/league from the item-embedded flat ref', () => {
    const match = normaliseMatch(WIRE_MATCH_REF)!;
    assert.equal(match.home.name, 'Real Madrid');
    assert.equal(match.away.name, 'FC Barcelona');
    assert.equal(match.home.logo, WIRE_MATCH_REF.home_team_logo);
    assert.equal(match.goals_home, 2);
    assert.equal(match.goals_away, 1);
    assert.equal(match.league?.name, 'La Liga');
    // serializeMatch carries no team ids, no league id, no venue, no status_long.
    assert.equal(match.home.id, null);
    assert.equal(match.league?.id, null);
    assert.equal(match.venue, undefined);
    assert.equal(match.status_long, null);
  });

  it('reads the extra columns the raw matches row has', () => {
    const match = normaliseMatch(WIRE_MATCH_ROW)!;
    assert.equal(match.home.id, 541);
    assert.equal(match.away.id, 529);
    assert.equal(match.league?.id, 140);
    assert.equal(match.league?.season, 2025);
    assert.equal(match.status_long, 'Match Finished');
    assert.deepEqual(match.venue, { id: null, name: 'Santiago Bernabéu', city: 'Madrid' });
  });

  it('returns null rather than a half-built ref when there is no match', () => {
    assert.equal(normaliseMatch(null), null);
    assert.equal(normaliseMatch(undefined), null);
    assert.equal(normaliseMatch({}), null);
  });
});

/* ================================================================== */
/* Envelopes                                                           */
/* ================================================================== */

describe('envelopes', () => {
  it('unwraps { items, nextCursor }', () => {
    const page = normaliseList({ items: [WIRE_TEASER], nextCursor: 'abc' });
    assert.equal(page.items.length, 1);
    assert.equal(page.items[0].like_count, 87);
    assert.equal(page.nextCursor, 'abc');
  });

  it('reads categories from `items`, not `categories`', () => {
    const categories = normaliseCategories(WIRE_CATEGORIES);
    assert.equal(categories.length, 2);
    assert.equal(categories[0].slug, 'behind-the-scenes');
    assert.equal(categories[1].position, 2);
  });

  it('unwraps the match page including pinned and phase_counts', () => {
    const page = normaliseMatchPage(WIRE_MATCH_PAGE);
    assert.equal(page.match?.id, 1035041);
    assert.equal(page.items.length, 2);
    assert.equal(page.pinned.length, 1);
    assert.equal(page.phase_counts.match_window, 18);
    assert.equal(page.nextCursor, WIRE_MATCH_PAGE.nextCursor);
    // The locked item in the list is still normalised, not dropped.
    assert.equal(page.items[1].locked, true);
    assert.deepEqual(page.items[1].assets, []);
  });

  it('reads from-madrid-now as { match, items, nextCursor, is_live }', () => {
    const timeline = normaliseTimeline(WIRE_FROM_MADRID_NOW);
    assert.equal(timeline.is_live, true);
    assert.equal(timeline.match?.id, 1035041);
    assert.equal(timeline.items.length, 1);
    assert.equal(timeline.nextCursor, null);
    // A payload without the flag must not poll.
    assert.equal(normaliseTimeline({ items: [] }).is_live, false);
  });

  it('unwraps the archive', () => {
    const archive = normaliseArchive(WIRE_ARCHIVE);
    assert.equal(archive.matches.length, 1);
    assert.equal(archive.matches[0].media_count, 42);
    assert.equal(archive.matches[0].match.home.name, 'Real Madrid');
    assert.equal(archive.matches[0].cover_items[0].cover_url, WIRE_TEASER.cover.url);
    assert.equal(archive.nextCursor, WIRE_ARCHIVE.nextCursor);
  });

  it('unwraps the home payload and groups its stories', () => {
    const home = normaliseHome(WIRE_HOME);
    assert.equal(home.featured.length, 1);
    assert.equal(home.latest.length, 2);
    assert.equal(home.from_madrid_now?.match?.id, 1035041);
    assert.equal(home.categories.length, 2);
    assert.equal(home.live_match?.status_long, 'Match Finished');
    // Two fixtures among the three story teasers → two bubbles.
    assert.equal(home.stories.length, 2);
  });

  it('reads playback assets and stamps the item id the caller asked for', () => {
    const playback = normalisePlayback(WIRE_PLAYBACK, WIRE_FULL.id);
    assert.equal(playback.item_id, WIRE_FULL.id);
    assert.equal(playback.assets.length, 2);
    assert.equal(playback.assets[0].hls_url, WIRE_FULL.assets[0].hls_url);
    // Earliest expiry wins — the set is stale when the first URL is.
    assert.equal(playback.expires_at, '2026-03-14T20:30:00.000Z');
  });

  it('reads the comment envelope as items + locked', () => {
    const page = normaliseCommentsPage(WIRE_COMMENTS, WIRE_TEASER.id);
    assert.equal(page.comments.length, 1);
    // Media rows carry `item_id`; the shared Comment type speaks `post_id`.
    assert.equal(page.comments[0].post_id, WIRE_TEASER.id);
    assert.equal(page.locked, false);

    const locked = normaliseCommentsPage(WIRE_COMMENTS_LOCKED, WIRE_TEASER.id);
    assert.deepEqual(locked.comments, []);
    assert.equal(locked.locked, true);
  });
});

/* ================================================================== */
/* Stories                                                             */
/* ================================================================== */

describe('story grouping', () => {
  const items = normaliseList(WIRE_STORIES).items;
  const groups = groupStoriesByMatch(items);

  it('makes one group per match, keyed by the fixture id', () => {
    assert.equal(groups.length, 2);
    assert.equal(groups[0].id, '1035041');
    assert.equal(groups[1].id, '900001');
    assert.equal(groups[0].items.length, 2);
    assert.equal(groups[1].items.length, 1);
  });

  it('labels a group "Home vs Away"', () => {
    assert.equal(groups[0].title, 'Real Madrid vs FC Barcelona');
    assert.equal(matchTitle(null), null);
  });

  it('takes the cover from the newest item in the group', () => {
    assert.equal(groups[0].cover_url, items[0].cover_url);
  });

  it('marks a group viewed only when every item in it is viewed', () => {
    // story-a is unviewed, story-b is viewed → the group is not.
    assert.equal(groups[0].viewed, false);
    assert.equal(groups[1].viewed, true);
  });

  it('buckets stories with no match under `no-match`, never the `all` sentinel', () => {
    const orphan = groupStoriesByMatch(normaliseItems([{ ...WIRE_TEASER, match: null }]));
    // Colliding with `all` would make /media/story/all open these few stories
    // instead of every story.
    assert.equal(orphan[0].id, 'no-match');
    assert.notEqual(orphan[0].id, 'all');
  });

  it('collapses everything into one group for /media/story/all', () => {
    const all = allStoriesGroup(items)!;
    assert.equal(all.id, 'all');
    assert.equal(all.items.length, 3);
    assert.equal(all.viewed, false);
    assert.equal(allStoriesGroup([]), null);
  });
});

/** Local helper so the orphan case above can build items without an envelope. */
function normaliseItems(raw: unknown[]) {
  return raw.map(normaliseItem);
}

/* ================================================================== */
/* Contributor                                                         */
/* ================================================================== */

describe('normaliseMe', () => {
  const me = normaliseMe(WIRE_CONTRIBUTOR_ME);

  it('reads maxAccessLevel from the top level, not the deprecated alias', () => {
    // The alias says `registered`; the contract field says `premium`. Reading
    // the alias silently downgrades what the contributor may publish.
    assert.equal(WIRE_CONTRIBUTOR_ME.contributor.max_access_level, 'registered');
    assert.equal(me.maxAccessLevel, 'premium');
  });

  it('still falls back to the alias when the contract field is absent', () => {
    const { maxAccessLevel: _omitted, ...legacy } = WIRE_CONTRIBUTOR_ME;
    assert.equal(normaliseMe(legacy).maxAccessLevel, 'registered');
  });

  it('reads the limits and the camelCase collections', () => {
    assert.equal(me.limits.maxGalleryAssets, 60);
    assert.equal(me.allowedMatches.length, 1);
    assert.equal(me.allowedCategories.length, 2);
    assert.equal(me.todayMatch?.id, 1035041);
    assert.equal(me.requiresApproval, false);
  });
});

/* ================================================================== */
/* Outbound bodies                                                     */
/* ================================================================== */

describe('analytics batch body', () => {
  it('keys every event on event_type, never `name`', () => {
    const body = buildEventsBody([
      {
        event_type: 'locked_view',
        item_id: WIRE_TEASER.id,
        occurred_at: '2026-03-14T20:00:00.000Z',
        anon_id: 'anon-1',
      },
    ]);
    assert.deepEqual(Object.keys(body), ['events']);
    assert.equal(body.events[0].event_type, 'locked_view');
    assert.equal('name' in body.events[0], false);
    // `eventService.normaliseEvent` drops anything it cannot key.
    assert.ok(body.events[0].event_type);
  });

  it('maps the two legacy call-site names onto the server vocabulary', () => {
    assert.equal(toEventType('signup_cta_click'), 'cta_click');
    assert.equal(toEventType('share_click'), 'share');
  });

  it('leaves an already-valid event type alone', () => {
    for (const name of ['item_view', 'locked_view', 'story_view', 'push_open', 'search'] as const) {
      assert.equal(toEventType(name), name);
    }
  });

  it('carries anon_id, which is what signup attribution joins on', () => {
    const body = buildEventsBody([
      { event_type: 'item_view', occurred_at: 'x', anon_id: 'anon-42' },
    ]);
    assert.equal(body.events[0].anon_id, 'anon-42');
  });
});

describe('device registration body', () => {
  const body = buildDeviceBody({
    expoPushToken: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
    platform: 'ios',
    anonId: 'anon-1',
    deviceName: 'iPhone 15',
    appVersion: '1.0.0',
    locale: 'en-US',
    timezone: 'Europe/Madrid',
    topics: ['media'],
  });

  it('keys the token as expo_push_token', () => {
    // `deviceService.upsertDevice` reads exactly this and 400s without it.
    assert.equal(body.expo_push_token, 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]');
    assert.equal('token' in body, false);
  });

  it('sends the rest of the contract fields', () => {
    assert.equal(body.platform, 'ios');
    assert.equal(body.device_name, 'iPhone 15');
    assert.equal(body.app_version, '1.0.0');
    assert.equal(body.locale, 'en-US');
    assert.equal(body.timezone, 'Europe/Madrid');
    assert.deepEqual(body.topics, ['media']);
  });

  it('always sends anon_id — it is the ownership proof for an anonymous device', () => {
    assert.equal(body.anon_id, 'anon-1');
  });

  it('omits country_code rather than sending null (the server stamps it from the IP)', () => {
    assert.equal('country_code' in body, false);
  });
});

describe('signed widths', () => {
  it('only ever asks for a whitelisted rung', () => {
    assert.equal(pickSignedWidth(320), 480);
    assert.equal(pickSignedWidth(480), 480);
    assert.equal(pickSignedWidth(900), 1080);
    assert.equal(pickSignedWidth(1170), 2048);
    assert.equal(pickSignedWidth(9000), 2048);
    assert.equal(pickSignedWidth(0), 1080);
  });
});

describe('cover transforms', () => {
  const cover = WIRE_TEASER.cover.url;

  it('returns the URL untouched when transforms are disabled', () => {
    assert.equal(transformCover(cover, 640, false), cover);
  });

  it('rewrites object/public → render/image/public with ?width= when enabled', () => {
    assert.equal(
      transformCover(cover, 640, true),
      'https://xyz.supabase.co/storage/v1/render/image/public/media-covers/a/cover.jpg?width=640',
    );
  });

  it('leaves a URL that is not a public storage object alone', () => {
    const signed = WIRE_FULL.assets[1].url;
    assert.equal(transformCover(signed, 640, true), signed);
    assert.equal(transformCover('https://videodelivery.net/abc/manifest/video.m3u8', 640, true),
      'https://videodelivery.net/abc/manifest/video.m3u8');
  });

  it('is idempotent', () => {
    const once = transformCover(cover, 640, true);
    assert.equal(transformCover(once, 1080, true), once);
  });
});
