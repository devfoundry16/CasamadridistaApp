import { useInfiniteQuery } from '@tanstack/react-query';
import CasaMediaService from '@/services/CasaMediaService';
import type { MediaPhase } from '@/types/media/casaMedia';
import { mediaKeys } from './keys';

interface Options {
  phase?: MediaPhase;
  category?: string;
}

/**
 * Media attached to one fixture. Paged, because a big match produces hundreds
 * of assets; the phase counts and pinned items ride on the first page only, so
 * always read them from `data.pages[0]`.
 */
export function useMatchMedia(matchId: number | undefined, options: Options = {}) {
  return useInfiniteQuery({
    queryKey: mediaKeys.match(matchId ?? 0, options as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      CasaMediaService.getMatchMedia(matchId!, { ...options, cursor: pageParam ?? null }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Number.isFinite(matchId) && (matchId ?? 0) > 0,
    staleTime: 60_000,
  });
}
