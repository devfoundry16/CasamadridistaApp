import { createContext, useCallback, useContext, useSyncExternalStore } from 'react';

/**
 * Feed video playback state, kept outside React state on purpose.
 *
 * `PostCard` is memo'd and a feed holds dozens of them. Each card subscribes
 * to "is my post the one playing?" through useSyncExternalStore, so a change
 * re-renders the two cards involved, not the whole list (FlatList
 * `extraData` would re-render every card).
 */

type Listener = () => void;

function createValue<T>(initial: T) {
  let value = initial;
  const listeners = new Set<Listener>();
  return {
    get: () => value,
    set: (next: T) => {
      if (Object.is(next, value)) return;
      value = next;
      listeners.forEach((l) => l());
    },
    subscribe: (l: Listener) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
  };
}

/**
 * Sound is one choice for the whole app: unmuting one feed video keeps the
 * next one, and the full-screen viewer, unmuted. Feeds start muted.
 */
const muted = createValue(true);

export function useFeedMuted(): [boolean, () => void] {
  const value = useSyncExternalStore(muted.subscribe, muted.get);
  const toggle = useCallback(() => muted.set(!muted.get()), []);
  return [value, toggle];
}

export const feedMutedNow = () => muted.get();

/** The post whose video plays in one list: one player per screen. */
export type ActiveVideoStore = ReturnType<typeof createValue<string | null>>;

export const createActiveVideoStore = (): ActiveVideoStore => createValue<string | null>(null);

interface PlaybackContext {
  active: ActiveVideoStore;
  /** Opens the full-screen viewer at this post, within this list's videos. */
  openVideo: (postId: string) => void;
}

const Ctx = createContext<PlaybackContext | null>(null);

export const FeedPlaybackProvider = Ctx.Provider;

const NOOP = () => () => {};

/** True for the one post of this list whose video plays. False outside a feed. */
export function useIsActiveVideo(postId: string): boolean {
  const ctx = useContext(Ctx);
  return useSyncExternalStore(
    ctx?.active.subscribe ?? NOOP,
    () => (ctx ? ctx.active.get() === postId : false),
  );
}

/** The list's "open full screen", or null outside a feed. */
export function useOpenVideo(): ((postId: string) => void) | null {
  return useContext(Ctx)?.openVideo ?? null;
}
