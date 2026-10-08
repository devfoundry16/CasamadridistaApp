import * as Notifications from 'expo-notifications';
import { router, useRootNavigationState, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';

import AnalyticsService from '@/services/AnalyticsService';
import NotificationService from '@/services/NotificationService';
import { hrefFromPayload, parsePushPayload } from '@/utils/pushPayload';

/**
 * Routes a notification tap to the right screen, from both a warm app and a
 * cold start.
 *
 * Two things make this subtle and are why it is a hook rather than a listener in
 * `PushService`:
 *
 *  1. `useLastNotificationResponse` replays the notification that *launched* the
 *     app, which the plain listener never sees. It also keeps returning that
 *     same response, so each one is de-duplicated by identifier.
 *  2. On a cold start the router is not mounted when the response arrives.
 *     `useRootNavigationState().key` is not enough on its own — it is the
 *     internal root slot, which exists before the app's <Stack> does — so the
 *     hook must be called from the component that renders the <Stack>
 *     (`RootLayoutNav`), and the push waits one frame past the commit that
 *     mounted it.
 */
export function useNotificationRouting() {
  const navigationState = useRootNavigationState();
  const lastResponse = Notifications.useLastNotificationResponse();
  const handled = useRef<Set<string>>(new Set());
  const ready = !!navigationState?.key;

  useEffect(() => {
    if (!ready || !lastResponse) return;
    handle(lastResponse, handled.current);
  }, [ready, lastResponse]);

  useEffect(() => {
    if (!ready) return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      handle(response, handled.current);
    });
    return () => sub.remove();
  }, [ready]);
}

function handle(response: Notifications.NotificationResponse, seen: Set<string>): void {
  const identifier = response.notification.request.identifier;
  if (seen.has(identifier)) return;
  seen.add(identifier);

  const payload = parsePushPayload(response.notification.request.content.data);
  if (!payload) return;

  AnalyticsService.track('push_open', {
    surface: 'push',
    item_id: payload.item_id,
    match_id: payload.match_id,
    campaign_id: payload.campaign_id,
    props: { type: payload.type },
  });
  void NotificationService.recordOpened({
    campaign_id: payload.campaign_id,
    item_id: payload.item_id,
  });

  const href = hrefFromPayload(payload);
  // Never inside the commit that mounted the navigator; `seen` is already set,
  // so a re-render cannot schedule it twice.
  if (href) requestAnimationFrame(() => router.push(href as Href));
}
