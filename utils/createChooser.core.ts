/**
 * Create from a profile (spec §3: "+ CREATE → Photo / Video / Story"), and the
 * "Your story" bubble in Community.
 *
 * Pure, so `node --test` can load it.
 */

export type CreateChoice = 'photo' | 'video' | 'reel' | 'story';

export const CREATE_CHOICES: readonly CreateChoice[] = ['photo', 'video', 'reel', 'story'];

/** Where each choice goes. Photo and Video open the composer on that picker. */
export function createHref(choice: CreateChoice): string {
  if (choice === 'story') return '/stories/create';
  return `/community/compose?start=${choice}`;
}

/** The composer's `start` param, as the library picker's media type; null for none. */
export function composeStart(param: string | string[] | undefined): 'images' | 'videos' | 'reel' | null {
  const value = Array.isArray(param) ? param[0] : param;
  if (value === 'photo') return 'images';
  if (value === 'video') return 'videos';
  if (value === 'reel') return 'reel';
  return null;
}

/**
 * "Your story": the bubble plays your live stories (or adds one when there are
 * none), and the + always adds one. It used to vanish once a story was live,
 * leaving a long-press as the only way to post another.
 */
export function yourStoryBubble({ viewerId, hasLive }: { viewerId: string; hasLive: boolean }) {
  return {
    open: hasLive ? `/stories/${viewerId}?from=row` : '/stories/create',
    add: '/stories/create',
    labelKey: hasLive ? 'stories.yourStory' : 'stories.add',
  };
}
