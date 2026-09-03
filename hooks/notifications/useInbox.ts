import { useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { notificationKeys } from '@/hooks/media/keys';
import { useUser } from '@/hooks/useUser';
import NotificationService from '@/services/NotificationService';
import PushService from '@/services/PushService';

/** Paged notification inbox plus the mark-read mutations that drive the badge. */
export function useInbox() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: notificationKeys.inbox(),
    queryFn: ({ pageParam }) => NotificationService.getInbox(pageParam ?? null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  const markRead = useMutation({
    mutationFn: (payload: { ids?: string[]; all?: boolean }) =>
      NotificationService.markRead(payload),
    onSuccess: (_data, payload) => {
      const readAt = new Date().toISOString();
      queryClient.setQueryData(notificationKeys.inbox(), (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            unread_count: payload.all ? 0 : Math.max(0, (page.unread_count ?? 0) - (payload.ids?.length ?? 0)),
            notifications: page.notifications.map((row: any) =>
              payload.all || payload.ids?.includes(row.id)
                ? { ...row, read_at: row.read_at ?? readAt }
                : row,
            ),
          })),
        };
      });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() });
      // Keep the OS badge in step with what the user just cleared.
      if (payload.all) void PushService.setBadgeCount(0);
    },
  });

  const markOneRead = useCallback(
    (id: string) => markRead.mutate({ ids: [id] }),
    [markRead],
  );

  const markAllRead = useCallback(() => markRead.mutate({ all: true }), [markRead]);

  const notifications = query.data?.pages.flatMap((page) => page.notifications) ?? [];
  const unreadCount = query.data?.pages[0]?.unread_count ?? 0;

  return { ...query, notifications, unreadCount, markOneRead, markAllRead };
}
