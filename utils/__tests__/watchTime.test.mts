/**
 * The seek rules for video watch time.
 *
 * Run with:  node --test utils/__tests__/watchTime.test.mts
 *
 * These exist because a watch-time number is never obviously wrong. The player
 * reports position, not progress, so summing the differences between ticks
 * credits a scrub across a clip as if it had been watched, and a drag backwards
 * as negative viewing. Both produce a plausible-looking figure on a dashboard
 * and neither shows up on a simulator. `.mts` for the same reason as the other
 * suites here — outside tsconfig's include, executed rather than type-checked.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  MAX_TICK_GAP_S,
  accumulate,
  emptyWatchState,
  markReported,
  restart,
  shouldFlush,
  unreportedSeconds,
  watchedSeconds,
} from '../watchTime.core.ts';

/** Play through a list of positions, one tick each. */
const play = (positions: number[], from = emptyWatchState()) =>
  positions.reduce((state, at) => accumulate(state, at), from);

describe('watchTime.core', () => {
  it('credits nothing for the first tick, only the gaps after it', () => {
    // The first tick establishes where playback is; it is not evidence that
    // anything was watched. Starting at 0:30 must not credit 30 seconds.
    const state = accumulate(emptyWatchState(), 30);
    assert.equal(state.watched, 0);
    assert.equal(state.lastTime, 30);
  });

  it('credits ordinary one-second playback', () => {
    assert.equal(play([0, 1, 2, 3]).watched, 3);
  });

  it('credits sub-second ticks at their real size', () => {
    // timeUpdateEventInterval is a request, not a guarantee.
    const state = play([0, 0.5, 1.25]);
    assert.equal(Math.round(state.watched * 100) / 100, 1.25);
  });

  it('credits nothing for a forward seek', () => {
    // 0 → 1 is watched. 1 → 60 is a scrub: the 59 seconds in between were
    // never on screen. Without this rule, scrubbing a clip end to end reports
    // the full duration as watch time.
    const state = play([0, 1, 60, 61]);
    assert.equal(state.watched, 2);
    assert.equal(state.lastTime, 61);
  });

  it('credits nothing for a backward seek, and never goes negative', () => {
    const state = play([0, 10, 2, 3]);
    // 0→10 is itself a forward seek (> the gap), so only 2→3 counts.
    assert.equal(state.watched, 1);
    assert.ok(state.watched >= 0);
  });

  it('treats a gap exactly at the threshold as watched, and one past it as a seek', () => {
    assert.equal(play([0, MAX_TICK_GAP_S]).watched, MAX_TICK_GAP_S);
    assert.equal(play([0, MAX_TICK_GAP_S + 0.01]).watched, 0);
  });

  it('credits nothing while paused, however many ticks repeat', () => {
    assert.equal(play([5, 5, 5, 5]).watched, 0);
  });

  it('ignores a bad reading without losing the seconds either side of it', () => {
    // A single NaN between two good positions must not be charged as a seek —
    // that would silently drop the second before and the second after.
    let state = play([0, 1]);
    state = accumulate(state, Number.NaN);
    state = accumulate(state, 2);
    assert.equal(state.watched, 2);
  });

  it('ignores a negative position', () => {
    const state = accumulate(play([0, 1]), -4);
    assert.equal(state.watched, 1);
    assert.equal(state.lastTime, 1);
  });

  it('keeps counting across a replay rather than starting over', () => {
    // Watching a 3-second clip twice is 6 seconds of watch time, not 3, and
    // not 3 plus a 3-second backward jump.
    const first = play([0, 1, 2, 3]);
    const second = play([0, 1, 2, 3], restart(first));
    assert.equal(second.watched, 6);
  });

  it('reports only what has not been reported yet', () => {
    let state = play([0, 1, 2]);
    assert.equal(unreportedSeconds(state), 2);
    state = markReported(state);
    assert.equal(unreportedSeconds(state), 0);
    state = play([3, 4], state);
    assert.equal(unreportedSeconds(state), 2);
    assert.equal(state.watched, 4);
  });

  it('does not flush sub-second dribble', () => {
    // pause → resume → pause posts twice; without a floor the second event
    // carries nothing and still costs a row.
    const state = play([0, 0.4]);
    assert.equal(shouldFlush(state), false);
    assert.equal(shouldFlush(play([0, 1])), true);
    assert.equal(shouldFlush(markReported(play([0, 1, 2]))), false);
  });

  it('rounds to whole seconds for the wire', () => {
    assert.equal(watchedSeconds(play([0, 1, 1.6])), 2);
    assert.equal(watchedSeconds(emptyWatchState()), 0);
  });
});
