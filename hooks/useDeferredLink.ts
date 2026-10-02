import { router, useRootNavigationState, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';

import { consumeDeferredLink } from '@/utils/deferredLink';

/**
 * On a launch soon after an install, open the Casa Media item (or match)
 * whose shared link sent the person to the store (§39).
 *
 * Waits for the router, like `useNotificationRouting`: navigating before
 * `useRootNavigationState().key` exists is silently dropped. A locked item
 * then shows its sign-up prompt, which already brings the person back to it
 * after they register.
 */
export function useDeferredLink() {
  const navigationState = useRootNavigationState();
  const ready = !!navigationState?.key;
  const started = useRef(false);

  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    void consumeDeferredLink().then((path) => {
      // `deeplink`, as the universal-link route reports it: the visit came
      // from a shared link, just by way of the store.
      if (path) router.push({ pathname: path, params: { surface: 'deeplink' } } as Href);
    });
  }, [ready]);
}
