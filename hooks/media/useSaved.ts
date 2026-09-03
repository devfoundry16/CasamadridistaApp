import { useInfiniteQuery } from '@tanstack/react-query';
import CasaMediaService from '@/services/CasaMediaService';
import { useUser } from '@/hooks/useUser';
import { mediaKeys } from './keys';

/**
 * The signed-in viewer's saved items. Auth-only — never fires for a guest, and
 * `enabled` lets a screen that conditionally shows saved media (the collection
 * route) mount the hook without paying for the request.
 */
export function useSavedMedia(enabled = true) {
  const { user } = useUser();
  return useInfiniteQuery({
    queryKey: mediaKeys.saved(),
    queryFn: ({ pageParam }) => CasaMediaService.getSaved(pageParam ?? null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: enabled && !!user?.id,
    staleTime: 60_000,
  });
}
