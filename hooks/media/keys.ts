import type { MediaArchiveQuery, MediaListQuery } from '@/services/CasaMediaService';

/**
 * Every Casa Media query key hangs off `mediaKeys.all`, which is what makes
 * "invalidate everything media" a one-liner when the signed-in user changes
 * (components/Auth/MediaAuthSync.tsx) and what lets `useMediaEngagement` sweep
 * every cached page for one item id.
 */
export const mediaKeys = {
  all: ['casaMedia'] as const,

  home: () => [...mediaKeys.all, 'home'] as const,
  categories: () => [...mediaKeys.all, 'categories'] as const,

  items: () => [...mediaKeys.all, 'item'] as const,
  item: (id: string) => [...mediaKeys.items(), id] as const,
  playback: (id: string) => [...mediaKeys.all, 'playback', id] as const,

  lists: () => [...mediaKeys.all, 'list'] as const,
  list: (query: MediaListQuery) => [...mediaKeys.lists(), normalise(query)] as const,

  matches: () => [...mediaKeys.all, 'match'] as const,
  match: (matchId: number, filters: Record<string, unknown> = {}) =>
    [...mediaKeys.matches(), matchId, normalise(filters)] as const,

  timelines: () => [...mediaKeys.all, 'timeline'] as const,
  timeline: (matchId: number) => [...mediaKeys.timelines(), matchId] as const,

  stories: () => [...mediaKeys.all, 'stories'] as const,

  archive: (query: MediaArchiveQuery = {}) =>
    [...mediaKeys.all, 'archive', normalise(query)] as const,
  archiveFilters: () => [...mediaKeys.all, 'archiveFilters'] as const,

  search: (q: string) => [...mediaKeys.all, 'search', q] as const,
  saved: () => [...mediaKeys.all, 'saved'] as const,
};

export const notificationKeys = {
  all: ['notifications'] as const,
  inbox: () => [...notificationKeys.all, 'inbox'] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
};

/**
 * The in-app contributor area. A separate root from `mediaKeys` on purpose:
 * these are editorial rows (drafts, pending review, the contributor's own
 * unpublished work) and must never be swept by a consumer-side invalidation.
 */
export const contributorKeys = {
  all: ['contributorMedia'] as const,
  me: () => [...contributorKeys.all, 'me'] as const,
  matches: () => [...contributorKeys.all, 'matches'] as const,
  items: () => [...contributorKeys.all, 'items'] as const,
  /**
   * Prefix shared by every "my content" page. Invalidating this hits all the
   * filtered lists and *only* them — `items()` would also match `item(id)`,
   * refetching every open editor for no reason.
   */
  itemLists: () => [...contributorKeys.items(), 'list'] as const,
  /** One page of "my content". */
  itemList: (query: object = {}) =>
    [...contributorKeys.itemLists(), normalise(query)] as const,
  item: (id: string) => [...contributorKeys.items(), id] as const,
  /**
   * One asset, keyed per asset rather than per item: `useAssetStatus` polls
   * `GET /api/casa-media/contributor/items/:id/assets/:assetId` while a single
   * upload transcodes, so two assets on the same item must not share a key.
   */
  asset: (itemId: string, assetId: string) =>
    [...contributorKeys.all, 'asset', itemId, assetId] as const,
  stats: (id?: string) => [...contributorKeys.all, 'stats', id ?? 'me'] as const,
};

/**
 * Key equality in React Query is structural but order-sensitive for objects?
 * No — it hashes with stable key sorting. Undefined values, however, survive
 * into the hash, so `{ category: undefined }` and `{}` would be different keys.
 * Strip them.
 */
function normalise(input: object): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const source = input as Record<string, unknown>;
  for (const key of Object.keys(source).sort()) {
    const value = source[key];
    if (value === undefined || value === null || value === '') continue;
    out[key] = value;
  }
  return out;
}
