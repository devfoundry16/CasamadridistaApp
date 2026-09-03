import type { QueryClient } from '@tanstack/react-query';
import type { MediaItem } from '@/types/media/casaMedia';
import { mediaKeys } from './keys';
import { mapMediaTree } from './mediaTree';

/**
 * Cache-wide reads and writes for a single media item.
 *
 * The tree walking itself lives in `./mediaTree.ts` (pure, node-testable); this
 * module is the thin React Query binding around it.
 */

export { mapMediaTree } from './mediaTree';

/** Apply `patch` to every cached copy of `itemId`, wherever it is nested. */
export function patchMediaItemEverywhere(
  queryClient: QueryClient,
  itemId: string,
  patch: (item: MediaItem) => MediaItem,
): void {
  queryClient.setQueriesData({ queryKey: mediaKeys.all }, (old: unknown) =>
    mapMediaTree(old, (item) => (item.id === itemId ? patch(item) : item)),
  );
}

/** First cached copy of `itemId` found anywhere under `mediaKeys.all`. */
export function findCachedMediaItem(
  queryClient: QueryClient,
  itemId: string,
): MediaItem | undefined {
  let found: MediaItem | undefined;
  for (const [, data] of queryClient.getQueriesData({ queryKey: mediaKeys.all })) {
    if (found) break;
    mapMediaTree(data, (item) => {
      if (!found && item.id === itemId) found = item;
      return item;
    });
  }
  return found;
}
