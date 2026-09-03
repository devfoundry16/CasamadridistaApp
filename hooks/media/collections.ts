import type { MediaListQuery } from '@/services/CasaMediaService';
import type { MediaCollection } from '@/types/media/casaMedia';

export type { MediaCollection };
export type MediaListQueryShape = MediaListQuery;

/**
 * The named collections are presentation sugar over the one `/items` endpoint —
 * they are *not* separate routes, and `exclusive` / `trending` are *not*
 * categories: the backend expresses them as `exclusive=1` (`access_level <>
 * 'public'`) and `sort=trending` (last 30 days by view count). Sending them as
 * `category=exclusive` matched no category row and returned an empty list.
 *
 * `latest-match` is the one collection this cannot express: it is a whole
 * different endpoint (`GET /matches/:id`), so it maps to an empty query and
 * `app/media/list/[collection].tsx` routes it to `useMatchMedia` instead.
 */
export function collectionToQuery(collection: MediaCollection): MediaListQuery {
  switch (collection) {
    case 'videos':
      return { type: 'video' };
    case 'photos':
      return { type: 'photo' };
    case 'stories':
      return { type: 'story' };
    case 'galleries':
      return { type: 'gallery' };
    case 'exclusive':
      return { exclusive: true };
    case 'trending':
      return { sort: 'trending' };
    case 'latest-match':
    case 'all':
    default:
      return {};
  }
}

/** `latest-match` is served by `GET /matches/:id`, not by `/items`. */
export function isMatchCollection(collection: MediaCollection): boolean {
  return collection === 'latest-match';
}

/** i18n key for a collection's screen title. */
export function collectionTitleKey(collection: MediaCollection): string {
  return `casaMedia.collection.${camel(collection)}`;
}

function camel(value: string): string {
  return value.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
}
