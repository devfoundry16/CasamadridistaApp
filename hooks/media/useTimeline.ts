import { useQuery } from '@tanstack/react-query';
import CasaMediaService from '@/services/CasaMediaService';
import { mediaKeys } from './keys';

/**
 * "From Madrid Now" — the reverse-chronological drop feed for one fixture.
 *
 * Polls every 20s while the server says the match is live, and stops the moment
 * it is not: this is the one screen users leave open for two hours, so an
 * unconditional interval would be a real battery and quota cost.
 */
export function useTimeline(matchId: number | undefined) {
  return useQuery({
    queryKey: mediaKeys.timeline(matchId ?? 0),
    queryFn: () => CasaMediaService.getTimeline(matchId!),
    enabled: Number.isFinite(matchId) && (matchId ?? 0) > 0,
    staleTime: 15_000,
    refetchInterval: (query) => (query.state.data?.is_live ? 20_000 : false),
  });
}
