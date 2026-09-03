import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { mediaKeys, notificationKeys } from '@/hooks/media/keys';
import { useUser } from '@/hooks/useUser';

/**
 * Invalidates every Casa Media query when the signed-in user changes.
 *
 * Access is server-enforced, so a payload cached while logged out is a *teaser*:
 * covers with `locked: true` and no assets. Without this, a user who signs up
 * from a locked item lands back on the item screen and still sees the paywall,
 * because React Query happily serves the stale teaser. Dropping the whole
 * `casaMedia` key space on an identity change is the only correct scope — the
 * same is true in reverse on sign-out.
 *
 * Renders nothing; mounted once in the root layout.
 */
export default function MediaAuthSync() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const current = user?.id ?? null;
    // Skip the first pass: nothing is cached yet on a cold start, and
    // invalidating here would cancel the hub's very first fetch.
    if (previousUserId.current === undefined) {
      previousUserId.current = current;
      return;
    }
    if (previousUserId.current === current) return;
    previousUserId.current = current;

    queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  }, [user?.id, queryClient]);

  return null;
}
