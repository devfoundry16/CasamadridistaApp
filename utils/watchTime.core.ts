/**
 * Pure half of the video watch-time accumulator.
 *
 * Until now the player emitted `video_progress` carrying `{ percent }` and
 * nothing else, so no seconds were captured anywhere in the product — not in an
 * event, not in a column, not in a rollup. That single gap is what made "watch
 * time" (§41, §44), "average watch time" (§29) and "average session duration"
 * (§43) unbuildable.
 *
 * The reason this is a module and not four lines inside the `timeUpdate`
 * listener: **seeks**. `expo-video` reports position, not progress. Scrubbing a
 * 90-second clip end to end would look like watching it if you simply summed the
 * differences, and dragging backwards would look like negative watching. Neither
 * is visible on a simulator — the number is just quietly wrong, in the direction
 * that flatters the content. So the seek rule is written down once, here, and
 * exercised directly by `utils/__tests__/watchTime.test.mts`.
 *
 * Free of react-native / expo imports so `node --test` can load it.
 */

/**
 * Ticks arrive once a second (`player.timeUpdateEventInterval = 1`). A jump
 * larger than this is a seek or a stall, not elapsed viewing, and contributes
 * nothing. Two seconds leaves room for a late tick without letting a scrub in.
 */
export const MAX_TICK_GAP_S = 2;

export interface WatchState {
  /** Seconds of forward playback actually observed. */
  watched: number;
  /** Last position seen, or null before the first tick of this item. */
  lastTime: number | null;
  /** How much of `watched` has already been sent to the server. */
  reported: number;
}

export function emptyWatchState(): WatchState {
  return { watched: 0, lastTime: null, reported: 0 };
}

/**
 * Fold one `timeUpdate` tick into the accumulator.
 *
 * Returns a new state; never mutates. A non-finite or negative position is
 * ignored entirely rather than resetting the position, because a single bad
 * reading between two good ones would otherwise be charged as a seek and lose
 * the second of viewing either side of it.
 */
export function accumulate(
  state: WatchState,
  currentTime: number,
  maxGapS: number = MAX_TICK_GAP_S,
): WatchState {
  if (!Number.isFinite(currentTime) || currentTime < 0) return state;
  if (state.lastTime === null) return { ...state, lastTime: currentTime };

  const delta = currentTime - state.lastTime;
  // delta <= 0 is a backward seek or a repeated tick while paused; delta > gap
  // is a forward seek or a stall. Both move the cursor and credit nothing.
  const credited = delta > 0 && delta <= maxGapS ? delta : 0;

  return { ...state, watched: state.watched + credited, lastTime: currentTime };
}

/**
 * Playback restarted from the top (replay, or the story viewer swapping items).
 * Watch time is cumulative across a replay — watching a clip twice is twice the
 * watch time — so only the position cursor resets.
 */
export function restart(state: WatchState): WatchState {
  return { ...state, lastTime: null };
}

/** Seconds accumulated but not yet sent. */
export function unreportedSeconds(state: WatchState): number {
  return Math.max(0, state.watched - state.reported);
}

/**
 * Whether a flush is worth an event. Sub-second dribble is not: the player
 * flushes on pause, on unmount and on backgrounding, and without a floor a
 * user tapping pause twice would post two events carrying nothing.
 */
export function shouldFlush(state: WatchState, minSeconds = 1): boolean {
  return unreportedSeconds(state) >= minSeconds;
}

/** Mark everything accumulated so far as sent. */
export function markReported(state: WatchState): WatchState {
  return { ...state, reported: state.watched };
}

/** Whole seconds, for the wire. Fractional milliseconds are noise here. */
export function watchedSeconds(state: WatchState): number {
  return Math.round(state.watched);
}
