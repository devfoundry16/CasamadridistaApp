import type { MediaItem } from '@/types/media/casaMedia';

/**
 * The structural walker behind `hooks/media/cache.ts`.
 *
 * One media item is surfaced in a dozen shapes — a home payload, an infinite
 * list's `pages`, a match page with `pinned` and `items`, a story group, an
 * archive entry's `cover_items`. Rather than teach every mutation about every
 * envelope, this walks whatever is cached and acts on anything that looks like
 * a MediaItem.
 *
 * Kept in its own module, with no runtime imports, so it can be exercised by
 * `node --test` (utils/__tests__/mediaCache.test.mts) — same split as the
 * `.core.ts` files under utils/.
 */

const MAX_DEPTH = 8;

/**
 * The heuristic: a string `id` plus an `access_level` key. A match ref or a
 * story group has an id but no access level, so it is walked *through* rather
 * than treated as an item.
 */
function isMediaItem(value: unknown): value is MediaItem {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as any).id === 'string' &&
    'access_level' in (value as any)
  );
}

/**
 * Structural map. Returns the *same* reference when nothing below changed, so
 * React Query's `setQueryData` does not invalidate untouched screens — that
 * reference-preservation is a load-bearing part of the contract, not an
 * optimisation detail.
 */
export function mapMediaTree(
  node: unknown,
  visit: (item: MediaItem) => MediaItem,
  depth = 0,
): unknown {
  if (depth > MAX_DEPTH || !node || typeof node !== 'object') return node;

  if (Array.isArray(node)) {
    let changed = false;
    const next = node.map((child) => {
      const mapped = mapMediaTree(child, visit, depth + 1);
      if (mapped !== child) changed = true;
      return mapped;
    });
    return changed ? next : node;
  }

  if (isMediaItem(node)) {
    const replaced = visit(node);
    // Even a replaced item can contain nested items (a story group's members),
    // so keep descending from the replacement.
    return mapObject(replaced, visit, depth);
  }

  return mapObject(node as Record<string, unknown>, visit, depth);
}

function mapObject(
  node: Record<string, unknown> | MediaItem,
  visit: (item: MediaItem) => MediaItem,
  depth: number,
): unknown {
  let changed = false;
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    const mapped = mapMediaTree(value, visit, depth + 1);
    if (mapped !== value) changed = true;
    next[key] = mapped;
  }
  return changed ? next : node;
}
