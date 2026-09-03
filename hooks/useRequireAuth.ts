import { useCallback } from 'react';
import { router } from 'expo-router';
import { useUser } from '@/hooks/useUser';
import AnalyticsService from '@/services/AnalyticsService';
import { setPendingReturnTo, type PendingReturnToInput } from '@/utils/returnTo';

export interface RequireAuthOptions extends PendingReturnToInput {
  /** 'login' opens the sheet on the sign-in tab; 'register' on sign-up. */
  mode?: 'login' | 'register';
}

/**
 * The auth gate.
 *
 * Returns `true` when the viewer is already signed in — the caller then just
 * does the thing. Otherwise it records where to come back to, tracks the CTA,
 * pushes the login modal and returns `false`.
 *
 *     if (!requireAuth({ href: `/media/item/${id}`, mediaId: id })) return;
 */
export function useRequireAuth() {
  const { user } = useUser();

  return useCallback(
    (options: RequireAuthOptions): boolean => {
      if (user?.id) return true;

      const { mode = 'register', ...pending } = options;

      // Persisted (not held in state) because Google sign-in leaves the app for
      // a browser and may come back through a cold start.
      void setPendingReturnTo(pending);

      AnalyticsService.track('signup_cta_click', {
        item_id: pending.mediaId,
        campaign_id: pending.campaignId,
        props: { mode },
      });

      router.push({
        pathname: '/auth/login',
        params: {
          returnTo: pending.href,
          ...(pending.mediaId ? { mediaId: pending.mediaId } : {}),
          mode,
        },
      });
      return false;
    },
    [user?.id],
  );
}
