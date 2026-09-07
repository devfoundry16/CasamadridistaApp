import React, { createContext, useContext } from 'react';

import type { MediaSurface } from '@/types/media/casaMedia';

/**
 * Which surface the user is looking at.
 *
 * §41 asks for "Community teaser → Media", and more generally for per-surface
 * reporting. The obstacle is that the navigation into an item happens inside
 * `MediaCard` / `TimelineRow`, which are shared by the hub, search, the archive,
 * the match page, Home and the community feed alike — the card cannot know where
 * it is, and the screen that does know is four component layers away.
 *
 * Threading a `surface` prop through `MediaGridList`, `MediaRail`,
 * `CollectionGrid` and every screen would touch a dozen files to move one
 * string. A context moves it in one: each screen wraps its content once, and the
 * cards read it wherever they end up.
 *
 * Defaults to `media` so an unwrapped surface reports something true rather than
 * nothing — the section itself is the honest fallback.
 */
const MediaSurfaceContext = createContext<MediaSurface>('media');

export function MediaSurfaceProvider({
  surface,
  children,
}: {
  surface: MediaSurface;
  children: React.ReactNode;
}) {
  return <MediaSurfaceContext.Provider value={surface}>{children}</MediaSurfaceContext.Provider>;
}

export function useMediaSurface(): MediaSurface {
  return useContext(MediaSurfaceContext);
}
