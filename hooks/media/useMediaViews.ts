import { useCallback, useRef } from 'react';
import type { ViewToken } from 'react-native';
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
 */
export function useMediaViews() {
  const reported = useRef<Set<string>>(new Set());

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const fresh: string[] = [];
      for (const token of viewableItems) {
        const id = (token.item as { id?: string } | null)?.id;
        if (!id || reported.current.has(id)) continue;
        reported.current.add(id);
        fresh.push(id);
      }
      if (fresh.length) void CasaMediaService.recordViews(fresh);
    },
    [],
  );

  return { onViewableItemsChanged, viewabilityConfig: MEDIA_VIEWABILITY_CONFIG };
}
