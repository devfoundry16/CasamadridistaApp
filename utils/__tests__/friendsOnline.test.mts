/**
 * Friends, C3: the Online section.
 *
 * Run with:  node --test utils/__tests__/friendsOnline.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ONLINE_WINDOW_MS, presenceWatchList, splitOnline } from '../chat.core.ts';

const now = Date.parse('2026-10-03T12:00:00Z');
const f = (id: string, minutesAgo: number | null) => ({
  id,
  last_active_at: minutesAgo === null ? null : new Date(now - minutesAgo * 60_000).toISOString(),
});

describe('splitOnline', () => {
  it('puts friends active in the last few minutes on top, most recent first', () => {
    const { online, rest } = splitOnline([f('a', 30), f('b', 1), f('c', 4), f('d', null)], now);
    assert.deepEqual(online.map((x) => x.id), ['b', 'c']);
    assert.deepEqual(rest.map((x) => x.id), ['a', 'd']);
  });
  it('the window is ten minutes: longer than the server stamps last-seen (every five)', () => {
    assert.equal(ONLINE_WINDOW_MS, 10 * 60_000);
    assert.equal(splitOnline([f('a', 8)], now).online.length, 1);
    assert.equal(splitOnline([f('a', 10.5)], now).online.length, 0);
  });
  it('a friend the presence channel shows live is online whatever their last-seen says', () => {
    const { online, rest } = splitOnline([f('a', 30), f('b', 40)], now, new Set(['b']));
    assert.deepEqual(online.map((x) => x.id), ['b']);
    assert.deepEqual(rest.map((x) => x.id), ['a']);
  });
  it('live friends lead the section', () => {
    const { online } = splitOnline([f('a', 1), f('b', 30)], now, new Set(['b']));
    assert.deepEqual(online.map((x) => x.id), ['b', 'a']);
  });
  it('someone who hides their activity is never in Online', () => {
    assert.equal(splitOnline([f('a', null)], now).online.length, 0);
  });
  it('a clock ahead of ours still counts as now', () => {
    assert.equal(splitOnline([f('a', -1)], now).online.length, 1);
  });
});

describe('presenceWatchList', () => {
  // One realtime channel per watched friend, and a connection has a limited
  // number: watch the most recently active ones only.
  it('the most recently active friends first, at most the cap, never those who hide activity', () => {
    const friends = [
      { id: 'a', last_active_at: '2026-10-01T10:00:00Z' },
      { id: 'b', last_active_at: null },
      { id: 'c', last_active_at: '2026-10-03T10:00:00Z' },
      { id: 'd', last_active_at: '2026-10-02T10:00:00Z' },
    ];
    assert.deepEqual(presenceWatchList(friends, 2), ['c', 'd']);
    assert.deepEqual(presenceWatchList(friends, 50), ['c', 'd', 'a']);
    assert.deepEqual(presenceWatchList([], 50), []);
  });
});
