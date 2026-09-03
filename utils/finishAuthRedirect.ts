import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router, type Href } from 'expo-router';
import { API_BASE_URL } from '@/config/supabase';
import AnalyticsService from '@/services/AnalyticsService';
import { claimAuthRedirect } from '@/utils/authRedirectLatch';
import { consumePendingReturnTo } from '@/utils/returnTo';

const DEFAULT_DESTINATION = '/(tabs)/account';

/**
 * Post-authentication landing.
 *
 * Shared by the login modal, the OAuth callback deeplink and Apple sign-in so
 * all three behave identically: consume the pending intent, attribute the
 * signup to the media item that drove it, then replace to wherever the user
 * was trying to go. Falls back to the account tab — the historical behaviour —
 * whenever nothing is pending.
 *
 * **Single-flight.** Google sign-in reaches this from two places at once (the
 * deeplink handler and the login modal's `user?.id` effect), and the second
 * caller would otherwise find the pending intent already consumed and redirect
 * to the account tab on top of the correct destination. `claimAuthRedirect`
 * makes every call after the first a no-op until a new returnTo is recorded —
 * see utils/authRedirectLatch.ts.
 */
export function finishAuthRedirect(): Promise<void> {
  return claimAuthRedirect(async () => {
    const pending = await consumePendingReturnTo();

    if (pending?.mediaId) {
      await postAttribution(pending.mediaId, pending.campaignId);
    }

    const destination = (pending?.href ?? DEFAULT_DESTINATION) as Href;
    router.replace(destination);
  });
}

/**
 * Links the `anon_id` that saw the locked teaser to the account just created.
 * Best-effort by design: the server also has a 7-day fallback that links the
 * most recent `locked_view` on the first authenticated event.
 */
export async function postAttribution(
  mediaId: string,
  campaignId?: string,
): Promise<void> {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) return;
    await axios.post(
      `${API_BASE_URL}auth/attribution`,
      {
        anon_id: await AnalyticsService.getAnonId(),
        item_id: mediaId,
        ...(campaignId ? { campaign_id: campaignId } : {}),
        source: 'mobile',
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  } catch {
    // Attribution is analytics, never a gate on signing in.
  }
}

/** Attribution block for the email-register request body. */
export async function buildAttributionPayload(
  mediaId?: string,
  campaignId?: string,
): Promise<Record<string, string> | undefined> {
  if (!mediaId && !campaignId) return undefined;
  return {
    anon_id: await AnalyticsService.getAnonId(),
    ...(mediaId ? { item_id: mediaId } : {}),
    ...(campaignId ? { campaign_id: campaignId } : {}),
    source: 'mobile',
  };
}
