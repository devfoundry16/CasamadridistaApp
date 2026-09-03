import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { notificationKeys } from '@/hooks/media/keys';
import { useUser } from '@/hooks/useUser';
import PushService from '@/services/PushService';

/**
 * Registers this device for push, and keeps the registration bound to whoever
 * is signed in.
 *
 * Re-runs on every `user.id` change — including sign-out (`undefined`), which
 * re-registers the same token anonymously so broadcast campaigns still reach the
 * install. Detaching the token from the *account* is `logoutUser`'s job, because
 * it has to happen while the auth token is still present.
 */
export function usePushRegistration() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  useEffect(() => {
    void PushService.register();
  }, [user?.id]);

  useEffect(() => {
    const stopTokenRefresh = PushService.installTokenRefreshListener();
    const stopForeground = PushService.installForegroundHandler(() => {
      // A notification arriving while the app is open should light the bell.
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });
    return () => {
      stopTokenRefresh();
      stopForeground();
    };
  }, [queryClient]);
}
