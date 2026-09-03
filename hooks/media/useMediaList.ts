import { useInfiniteQuery } from '@tanstack/react-query';
import CasaMediaService, { type MediaListQuery } from '@/services/CasaMediaService';
import type { MediaCollection, MediaListQueryShape } from './collections';
import { collectionToQuery } from './collections';
import { mediaKeys } from './keys';

/**
 * Cursor-paged `/casa-media/items`. Same `useInfiniteQuery` shape as the
 * community feed so the list components behave identically.
 */
export function useMediaList(query: MediaListQuery = {}, enabled = true) {
  return useInfiniteQuery({
    queryKey: mediaKeys.list(query),
    queryFn: ({ pageParam }) => CasaMediaService.list({ ...query, cursor: pageParam ?? null }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
    staleTime: 60_000,
  });
}

/** The named collections addressed by `app/media/list/[collection].tsx`. */
export function useMediaCollection(
  collection: MediaCollection,
  extra: MediaListQueryShape = {},
  enabled = true,
) {
  return useMediaList({ ...collectionToQuery(collection), ...extra }, enabled);
}

export { collectionToQuery } from './collections';
