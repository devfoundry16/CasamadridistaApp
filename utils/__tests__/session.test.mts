/**
 * The idle-window rules for analytics sessions.
 *
 * Run with:  node --test utils/__tests__/session.test.mts
 *
 * Both failure modes are silent. A session id that never rolls over makes every
 * reported "session duration" the age of the install; one that rolls over on
 * every event makes every session zero seconds long. Neither throws, neither is
 * visible in the app, and both look like real numbers on a dashboard.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  SESSION_IDLE_MS,
  SESSION_MAX_MS,
  parseSession,
  resolveSession,
} from '../session.core.ts';

const NOW = 1_700_000_000_000;
const MINUTE = 60_000;

describe('session.core', () => {
  it('opens a session when there is no prior state', () => {
    const { state, started } = resolveSession(null, NOW, 'fresh');
    assert.equal(started, true);
    assert.deepEqual(state, { id: 'fresh', startedAt: NOW, lastSeenAt: NOW });
  });

  it('keeps the same session inside the idle window and advances lastSeenAt', () => {
    const first = resolveSession(null, NOW, 'a').state;
    const second = resolveSession(first, NOW + 5 * MINUTE, 'b');
    assert.equal(second.started, false);
    assert.equal(second.state.id, 'a');
    assert.equal(second.state.startedAt, NOW, 'startedAt must not drift');
    assert.equal(second.state.lastSeenAt, NOW + 5 * MINUTE);
  });

  it('treats a gap exactly at the window as the same session, and one past it as new', () => {
    const first = resolveSession(null, NOW, 'a').state;
    assert.equal(resolveSession(first, NOW + SESSION_IDLE_MS, 'b').started, false);
    assert.equal(resolveSession(first, NOW + SESSION_IDLE_MS + 1, 'b').started, true);
  });

  it('measures the gap from the last event, not from the start', () => {
    // Twenty-five minutes of steady use is one session, not two, even though
    // the total elapsed time is past the idle window.
    let state = resolveSession(null, NOW, 'a').state;
    for (let i = 1; i <= 5; i += 1) {
      state = resolveSession(state, NOW + i * 5 * MINUTE, `x${i}`).state;
    }
    assert.equal(state.id, 'a');
    assert.equal(state.lastSeenAt, NOW + 25 * MINUTE);
  });

  it('cuts off a session that has run past the ceiling', () => {
    // A player left open overnight would otherwise report an eight-hour visit
    // and skew every average that touches it.
    const stale = { id: 'a', startedAt: NOW, lastSeenAt: NOW + SESSION_MAX_MS };
    const next = resolveSession(stale, NOW + SESSION_MAX_MS + 1, 'b');
    assert.equal(next.started, true);
    assert.equal(next.state.id, 'b');
  });

  it('opens a new session when the clock has moved backwards past the start', () => {
    // A timezone change or an NTP correction; the alternative is a session with
    // a negative duration.
    const prior = { id: 'a', startedAt: NOW, lastSeenAt: NOW + MINUTE };
    const next = resolveSession(prior, NOW - MINUTE, 'b');
    assert.equal(next.started, true);
  });

  it('does not let small backwards jitter shorten a live session', () => {
    const prior = { id: 'a', startedAt: NOW, lastSeenAt: NOW + 2 * MINUTE };
    const next = resolveSession(prior, NOW + MINUTE, 'b');
    assert.equal(next.started, false);
    assert.equal(next.state.lastSeenAt, NOW + 2 * MINUTE);
  });

  it('only consumes the fresh id when a session actually starts', () => {
    const prior = resolveSession(null, NOW, 'a').state;
    assert.equal(resolveSession(prior, NOW + MINUTE, 'unused').state.id, 'a');
  });

  it('round-trips persisted state', () => {
    const state = resolveSession(null, NOW, 'a').state;
    assert.deepEqual(parseSession(JSON.stringify(state)), state);
  });

  it('returns null for anything malformed rather than resuming a broken session', () => {
    assert.equal(parseSession(null), null);
    assert.equal(parseSession(''), null);
    assert.equal(parseSession('not json'), null);
    assert.equal(parseSession('"a string"'), null);
    assert.equal(parseSession('{"id":"a"}'), null);
    assert.equal(parseSession('{"id":"","startedAt":1,"lastSeenAt":1}'), null);
    assert.equal(parseSession('{"id":"a","startedAt":"1","lastSeenAt":1}'), null);
  });
});
