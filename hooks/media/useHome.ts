import { useQuery } from '@tanstack/react-query';
import CasaMediaService from '@/services/CasaMediaService';
import { mediaKeys } from './keys';

/**
 * The Casa Media hub payload (rails, stories, live match).
 *
 * 60s staleTime: on a match day the correspondent publishes every few minutes,
 * and the hub is the screen people pull back to. The `QueryClient` is left at
 * its empty defaults on purpose — staleTime is a per-hook decision here.
 */
export function useMediaHome() {
  return useQuery({
    queryKey: mediaKeys.home(),
    queryFn: () => CasaMediaService.getHome(),
    staleTime: 60_000,
  });
}

export function useMediaCategories() {
  return useQuery({
    queryKey: mediaKeys.categories(),
    queryFn: () => CasaMediaService.getCategories(),
    staleTime: 10 * 60_000,
  });
}
