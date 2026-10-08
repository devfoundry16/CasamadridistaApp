/**
 * User stories in the app (Social, C1). Pure; mirrors backend storyRules.
 */

export const MAX_VIDEO_MS = 15_000;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const PHOTO_SHOW_MS = 5000;
export const QUICK_REACTIONS = ['❤️', '🔥', '👏', '😂', '😮', '⚽'] as const;

/** The ring on a profile picture: gold while something is unseen. */
export function ringState(stories: { seen: boolean }[]): 'unseen' | 'seen' | null {
  if (!stories.length) return null;
  return stories.some((s) => !s.seen) ? 'unseen' : 'seen';
}

/** Why a picked file cannot be a story, or null. */
export function pickProblem(asset: { type?: string | null; durationMs?: number | null; fileSize?: number | null }): 'too_long' | 'too_large' | null {
  const video = asset.type === 'video';
  if (video && (asset.durationMs ?? 0) > MAX_VIDEO_MS + 500) return 'too_long';
  if ((asset.fileSize ?? 0) > (video ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES)) return 'too_large';
  return null;
}

export function showForMs(story: { kind: 'photo' | 'video'; duration_ms: number | null }): number {
  if (story.kind === 'photo') return PHOTO_SHOW_MS;
  return story.duration_ms && story.duration_ms > 0 ? story.duration_ms : MAX_VIDEO_MS;
}

export interface Position {
  group: number;
  story: number;
}

/** The next (+1) or previous (-1) story across people, or 'close' past the end. */
export function step(groups: { stories: unknown[] }[], at: Position, dir: 1 | -1): Position | 'close' {
  if (dir === 1) {
    if (at.story + 1 < groups[at.group].stories.length) return { group: at.group, story: at.story + 1 };
    if (at.group + 1 < groups.length) return { group: at.group + 1, story: 0 };
    return 'close';
  }
  if (at.story > 0) return { group: at.group, story: at.story - 1 };
  if (at.group > 0) return { group: at.group - 1, story: groups[at.group - 1].stories.length - 1 };
  return at;
}

export function uploadMimeType(asset: { type?: string | null; mimeType?: string | null }): string {
  if (asset.mimeType) return asset.mimeType;
  return asset.type === 'video' ? 'video/mp4' : 'image/jpeg';
}

/** After muting someone: straight to the next person, or 'close'. */
export function nextAuthor(groups: { stories: unknown[] }[], at: Position): Position | 'close' {
  return at.group + 1 < groups.length ? { group: at.group + 1, story: 0 } : 'close';
}

/**
 * A video story's progress, from the player's own clock (seconds), so
 * buffering pauses the bar instead of cutting the end off the clip.
 */
export function videoProgress(currentTime: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(currentTime)) return 0;
  return Math.min(1, Math.max(0, currentTime / duration));
}

/**
 * How long a story may still be shown. 0 once its 24 hours are over (or when
 * it has no end time): the viewer works from a snapshot taken on open, so it
 * checks the clock itself rather than keep playing an expired story.
 */
export function msUntilExpiry(story: { expires_at: string | null }, now: number): number {
  const at = Date.parse(story.expires_at ?? '');
  return Number.isFinite(at) ? Math.max(0, at - now) : 0;
}

/** Where the viewer starts in one person's stories: the one asked for, else the first. */
export function storyIndex(stories: readonly { id: string }[], storyId: string | undefined): number {
  if (!storyId) return 0;
  return Math.max(0, stories.findIndex((s) => s.id === storyId));
}

/** One tile of a profile's stories strip: a photo itself, a video its poster frame. */
export function stripTile(story: { kind: 'photo' | 'video'; url: string | null; thumbnail_url: string | null; seen: boolean }) {
  const video = story.kind === 'video';
  return { image: video ? story.thumbnail_url : story.url ?? story.thumbnail_url, video, unseen: !story.seen };
}
