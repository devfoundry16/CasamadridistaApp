/**
 * The profile's tabs and its 3-column post grid.
 *
 * No imports, so `utils/__tests__/profileGrid.test.mts` runs it under
 * `node --test`. The cell maths is shared with Casa Media's
 * `components/Media/GalleryGrid.tsx`.
 */

export type ProfileTab = 'posts' | 'videos' | 'tagged' | 'saved';

/** Saved is private: it only exists on your own profile. */
export function profileTabs(isSelf: boolean): ProfileTab[] {
  return isSelf ? ['posts', 'videos', 'tagged', 'saved'] : ['posts', 'videos', 'tagged'];
}

export const GRID_COLUMNS = 3;
export const GRID_GAP = 2;

/**
 * The side of one square cell: the width, less the page padding on both sides
 * and the gaps between columns, split evenly and floored so a row never wraps.
 */
export function gridCellSize(width: number, edge = 0, gap = GRID_GAP, columns = GRID_COLUMNS): number {
  if (!Number.isFinite(width) || width <= 0) return 0;
  return Math.max(0, Math.floor((width - edge * 2 - gap * (columns - 1)) / columns));
}

/** The corner badge on a cell: a video, several photos, or nothing. */
export function gridBadge(item: { is_video: boolean; media_count: number }): 'video' | 'multi' | null {
  if (item.is_video) return 'video';
  return item.media_count > 1 ? 'multi' : null;
}
