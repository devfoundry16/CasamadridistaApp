import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { useUser } from '@/hooks/useUser';
import SocialService from '@/services/SocialService';
import { socialKeys } from './keys';

/**
 * The conversation list. Fetching it also acknowledges delivery server-side,
 * which is what turns the sender's ✓ into ✓✓.
 */
export function useInbox(box: 'inbox' | 'requests') {
  const { user } = useUser();
  return useInfiniteQuery({
    queryKey: socialKeys.inbox(box),
    queryFn: ({ pageParam }) => SocialService.inbox(box, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.next_before ?? undefined,
    enabled: !!user?.id,
    staleTime: 15_000,
  });
}

/**
 * The header badge. Kept live by `SocialRealtimeSync`, which invalidates it on
 * every `inbox` broadcast — so the interval here is only a fallback for a
 * dropped socket.
 */
export function useUnreadMessages() {
  const { user } = useUser();
  return useQuery({
    queryKey: socialKeys.unread(),
    queryFn: () => SocialService.unread(),
    enabled: !!user?.id,
    staleTime: 30_000,
    refetchInterval: 120_000,
  });
}
