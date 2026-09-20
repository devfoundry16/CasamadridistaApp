import { useCallback } from 'react';
import { router } from 'expo-router';
import { useUser } from '@/hooks/useUser';
import AnalyticsService from '@/services/AnalyticsService';
import type { MediaSurface } from '@/types/media/casaMedia';
import { setPendingReturnTo, type PendingReturnToInput } from '@/utils/returnTo';

export interface RequireAuthOptions extends PendingReturnToInput {
  /** 'login' opens the sheet on the sign-in tab; 'register' on sign-up. */
  mode?: 'login' | 'register';
  /**
   * Which surface the CTA was tapped on, for the `signup_cta_click` this emits.
   *
   * Optional, and absent stays absent — **do not** default it here, and do not
   * read `useMediaSurface()` from this hook. This gate is generic:
   * `hooks/media/useFollow.ts`, `components/Contributor/ContributorGate.tsx`,
   * `components/Social/PostShareSheet.tsx` and `app/user/[id].tsx` all call it,
   * and the media context's `'media'` default would stamp a confidently wrong
   * surface on every one of them. A NULL that reads as "unknown" is better than
   * a value that reads as "the Media section" and is not.
   *
   * Only a caller that knows its own surface passes it — today that is
   * `components/Media/LockedOverlay.tsx`, matching what its premium branch
   * already emits directly.
   */
  surface?: MediaSurface;
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

      const { mode = 'register', surface, ...pending } = options;

      // Persisted (not held in state) because Google sign-in leaves the app for
      // a browser and may come back through a cold start.
      void setPendingReturnTo(pending);

      AnalyticsService.track('signup_cta_click', {
        item_id: pending.mediaId,
        campaign_id: pending.campaignId,
        ...(surface ? { surface } : {}),
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
