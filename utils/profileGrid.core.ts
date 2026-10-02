/**
 * The profile's tabs and its 3-column post grid.
 *
 * No imports, so `utils/__tests__/profileGrid.test.mts` runs it under
 * `node --test`. The cell maths is shared with Casa Media's
 * `components/Media/GalleryGrid.tsx`.
 */

export type ProfileTab = 'posts' | 'videos' | 'tagged' | 'media' | 'saved';

/**
 * Media is what a Casa Media contributor published there, so it only exists on
 * a contributor's profile. Saved is private: it only exists on your own.
 */
export function profileTabs(isSelf: boolean, isContributor = false): ProfileTab[] {
  return [
    'posts',
    'videos',
    'tagged',
    ...(isContributor ? (['media'] as const) : []),
    ...(isSelf ? (['saved'] as const) : []),
  ];
}

/** A grid cell, as the profile grid draws one (`ProfileGridItem`). */
export interface GridCell {
  id: string;
  kind: 'text' | 'image' | 'video' | 'media_teaser';
  thumb_url: string | null;
  media_count: number;
  is_video: boolean;
  created_at: string | null;
}

/**
 * A Casa Media item as a profile grid cell, for the Media tab. An item whose
 * asset count is zero still stands for one item.
 */
export function mediaGridCell(item: {
  id: string;
  type: string;
  cover_url: string | null;
  asset_count: number;
  published_at: string | null;
}): GridCell {
  const isVideo = item.type === 'video';
  return {
    id: item.id,
    kind: isVideo ? 'video' : 'image',
    thumb_url: item.cover_url,
    media_count: Math.max(1, item.asset_count),
    is_video: isVideo,
    created_at: item.published_at,
  };
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
