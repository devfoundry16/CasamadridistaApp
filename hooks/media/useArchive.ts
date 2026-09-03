import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import CasaMediaService, { type MediaArchiveQuery } from '@/services/CasaMediaService';
import { mediaKeys } from './keys';

/**
 * Match-by-match archive. 10 min staleTime — finished matches do not grow new
 * media, so this is the coldest read in the whole feature.
 *
 * `enabled` exists because `app/media/list/[collection].tsx` only needs the
 * archive as a *fallback* source for the `latest-match` fixture. Fetching it
 * unconditionally would mean every visit to that screen pulls the whole archive
 * page just to read one id that the hub payload usually already has.
 */
export function useArchive(query: MediaArchiveQuery = {}, enabled = true) {
  return useInfiniteQuery({
    queryKey: mediaKeys.archive(query),
    queryFn: ({ pageParam }) =>
      CasaMediaService.getArchive({ ...query, cursor: pageParam ?? null }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
    staleTime: 10 * 60_000,
  });
}

export function useArchiveFilters() {
  return useQuery({
    queryKey: mediaKeys.archiveFilters(),
    queryFn: () => CasaMediaService.getArchiveFilters(),
    staleTime: 30 * 60_000,
  });
}
