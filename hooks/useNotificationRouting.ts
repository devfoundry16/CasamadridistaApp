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
 *     Navigating then is a no-op that silently drops the deep link, so we wait
 *     for `useRootNavigationState().key`.
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
  if (href) router.push(href as Href);
}
