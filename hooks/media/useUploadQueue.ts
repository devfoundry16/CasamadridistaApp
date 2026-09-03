import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
  makeSelectItemReadiness,
  makeSelectItemUploads,
  selectActiveUploadCount,
  selectFailedUploadCount,
  selectUploadEntries,
} from '@/store/slices/uploadQueueSlice';
import type { RootState } from '@/store/store';
import type { QueueReadiness, UploadEntry } from '@/services/upload/uploadPolicy.core';

/** Everything currently in the queue, oldest first. */
export function useUploadQueue(): UploadEntry[] {
  return useSelector(selectUploadEntries);
}

export function useUploadCounts(): { active: number; failed: number } {
  const active = useSelector(selectActiveUploadCount);
  const failed = useSelector(selectFailedUploadCount);
  return { active, failed };
}

/**
 * The queue rows for one item.
 *
 * `useMemo` around the selector factory is not optional: `createSelector`
 * memoises on its own arguments, so a selector shared between two mounted item
 * screens would recompute on every render of either. One selector instance per
 * hook call keeps each screen's cache to itself.
 */
export function useItemUploads(itemId: string | undefined): UploadEntry[] {
  const selector = useMemo(makeSelectItemUploads, []);
  return useSelector((state: RootState) => selector(state, itemId));
}

export function useItemUploadReadiness(itemId: string | undefined): QueueReadiness {
  const selector = useMemo(makeSelectItemReadiness, []);
  return useSelector((state: RootState) => selector(state, itemId));
}
