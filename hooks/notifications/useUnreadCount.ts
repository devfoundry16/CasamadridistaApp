import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/useUser';
import NotificationService from '@/services/NotificationService';
import { notificationKeys } from '@/hooks/media/keys';

/**
 * Unread badge count.
 *
 * Reads the first inbox page rather than a dedicated endpoint, because the
 * inbox response already carries `unread_count` and the contract defines no
 * separate count route. It is its own query key (the inbox itself is an
 * infinite query with a different shape), so this is one extra request every
 * 30s while the bell is on screen — the header is mounted on every tab, so the
 * staleTime is what keeps that honest.
 */
export function useUnreadCount() {
  const { user } = useUser();
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: async () => (await NotificationService.getInbox()).unread_count,
    enabled: !!user?.id,
    staleTime: 30_000,
  });
}
