/**
 * Which posts on screen are new views: each post once per session, so the
 * feed no longer re-sends everything visible on every scroll.
 *
 * Run with:  node --test utils/__tests__/postViews.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { VIEWS_BATCH_MAX, forgetViewed, newlyViewed, viewSessionFor } from '../postViews.core.ts';

describe('newlyViewed', () => {
  it('answers only ids not sent before, and remembers them', () => {
    const sent = new Set<string>();
    assert.deepEqual(newlyViewed(sent, ['a', 'b']), ['a', 'b']);
    assert.deepEqual(newlyViewed(sent, ['b', 'c']), ['c']);
    assert.deepEqual(newlyViewed(sent, ['a', 'b', 'c']), []);
  });

  it('drops empty ids and repeats within one call', () => {
    const sent = new Set<string>();
    assert.deepEqual(newlyViewed(sent, ['a', '', 'a', null as unknown as string]), ['a']);
  });

  it('never sends more than the server takes in one call', () => {
    const sent = new Set<string>();
    const ids = Array.from({ length: 70 }, (_, i) => `p${i}`);
    assert.equal(newlyViewed(sent, ids).length, VIEWS_BATCH_MAX);
    assert.equal(newlyViewed(sent, ids).length, 20, 'the rest go next time');
  });
});

describe('viewSessionFor', () => {
  it('keeps the same sets through a UTC day, and starts fresh the next day', () => {
    const first = viewSessionFor(null, new Date('2026-10-13T08:00:00Z'));
    first.feed.add('a');
    assert.equal(viewSessionFor(first, new Date('2026-10-13T23:59:59Z')), first);
    const next = viewSessionFor(first, new Date('2026-10-14T00:00:01Z'));
    assert.notEqual(next, first);
    assert.equal(next.day, '2026-10-14');
    assert.equal(next.feed.size, 0, 'yesterday\'s posts count again today');
  });
});

describe('forgetViewed', () => {
  it('a call that failed is sent again next time', () => {
    const sent = new Set<string>();
    const fresh = newlyViewed(sent, ['a', 'b']);
    forgetViewed(sent, fresh);
    assert.deepEqual(newlyViewed(sent, ['a', 'b']), ['a', 'b']);
  });
});
