/**
 * The pure half of the Casa Media item screen (`app/media/item/[id].tsx`).
 *
 * Zero imports, so `utils/__tests__/mediaItem.test.mts` runs it under
 * `node --test`.
 */

/**
 * Should the screen ask for fresh signed playback URLs?
 *
 * Only for the types that can carry a clip — a video, and a short update, which
 * is media plus a short text and may be either a photo or a clip — and never
 * for a locked teaser, which has no assets to play.
 */
export function needsPlayback(
  item: { type: string; locked?: boolean | null } | null | undefined,
): boolean {
  if (!item || item.locked) return false;
  return item.type === 'video' || item.type === 'update';
}

/** A vertical clip's frame is capped at this share of the screen height, so
 *  the title and the engagement bar stay reachable without scrolling far. */
const TALL_PLAYER_MAX = 0.7;

/**
 * How tall the cover / inline player is.
 *
 * 16:9 for everything except a vertical short, which gets a 9:16 frame so the
 * clip is not letterboxed into a thin strip.
 */
export function playerHeight(
  screen: { width: number; height: number },
  item: { type: string; video_format?: string | null },
): number {
  if (item.type === 'video' && item.video_format === 'vertical_short') {
    return Math.min(Math.round(screen.width * (16 / 9)), Math.round(screen.height * TALL_PLAYER_MAX));
  }
  return Math.round(screen.width * (9 / 16));
}

/**
 * The text under the title: the short description, then the caption when it
 * says something else. Quick Post writes the same text to both, and showing it
 * twice would read as a bug.
 */
export function itemTexts(item: { description?: string | null; caption?: string | null }): string[] {
  const description = item.description?.trim() ?? '';
  const caption = item.caption?.trim() ?? '';
  return [description, caption !== description ? caption : ''].filter((text) => text.length > 0);
}
