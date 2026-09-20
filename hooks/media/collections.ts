import type { MediaListQuery } from '@/services/CasaMediaService';
import type { MediaCollection, MediaFollowKind } from '@/types/media/casaMedia';

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

/**
 * Where to land a signed-out user after they tap "Notify me" and authenticate
 * (§26) — the screen that carries the toggle, so they come back to the control
 * they were reaching for.
 *
 * Each kind has exactly one home: a match follow is only offered on the match's
 * media tab, and a category follow only in the collection list's header. They
 * are different route shapes, which is what the single hardcoded href this
 * replaced got wrong — it pointed at `/media/match/<id>`, a path that does not
 * exist for either kind. `isSafeReturnHref` accepts any in-app absolute path,
 * so nothing downstream caught it and the user landed on the not-found screen.
 */
export function followReturnHref(kind: MediaFollowKind, ref: string): string {
  return kind === 'match'
    ? `/match/${encodeURIComponent(ref)}/media`
    : `/media/list/all?category=${encodeURIComponent(ref)}`;
}

function camel(value: string): string {
  return value.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
}
