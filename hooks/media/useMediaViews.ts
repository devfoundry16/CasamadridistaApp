import { useCallback, useRef } from 'react';
import type { ViewToken } from 'react-native';
import { useMediaSurface } from '@/components/Media/MediaSurfaceContext';
import AnalyticsService from '@/services/AnalyticsService';
import CasaMediaService from '@/services/CasaMediaService';

/** Same thresholds the community feed uses, so "seen" means the same thing. */
export const MEDIA_VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 60,
  minimumViewTime: 300,
};

/**
 * Batched impression counting for a media list.
 *
 * Each id is reported once per mounted list: the Redis counters behind
 * `/views` are impressions, not scroll events, and a user bouncing an item in
 * and out of the viewport should not inflate them.
 *
 * Two different things are recorded, and the split matters. `/views` moves the
 * item's counter, which is what `sort=trending` reads. The `item_impression`
 * event is the analytics half — the top of the §41 funnel, and until now the
 * one stage nobody emitted, so `impressions` was a permanent zero on the
 * dashboard while `item_view` silently absorbed this traffic and made "views"
 * mean "cards scrolled past".
 */
export function useMediaViews() {
  const reported = useRef<Set<string>>(new Set());

  // Read through a ref, not a dependency: this callback is handed straight to a
  // FlatList, and React Native throws outright if `onViewableItemsChanged`
  // changes identity after mount.
  const surface = useMediaSurface();
  const surfaceRef = useRef(surface);
  surfaceRef.current = surface;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const fresh: string[] = [];
      for (const token of viewableItems) {
        const id = (token.item as { id?: string } | null)?.id;
        if (!id || reported.current.has(id)) continue;
        reported.current.add(id);
        fresh.push(id);
      }
      if (!fresh.length) return;

      void CasaMediaService.recordViews(fresh);
      for (const id of fresh) {
        AnalyticsService.track('item_impression', { item_id: id, surface: surfaceRef.current });
      }
    },
    [],
  );

  return { onViewableItemsChanged, viewabilityConfig: MEDIA_VIEWABILITY_CONFIG };
}
