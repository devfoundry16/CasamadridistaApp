/**
 * The Reels strip on Home: the newest ready reels as small 9:16 tiles, each
 * one the full-screen viewer can play, so a tap never lands on a reel the
 * viewer would skip.
 *
 * Run with:  node --test utils/__tests__/reelStrip.test.mts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { REEL_STRIP_MAX, reelStripItems } from '../feedAutoplay.core.ts';

const reel = (id: string, over: Record<string, unknown> = {}, media: Record<string, unknown> = {}) => ({
  id,
  kind: 'video',
  format: 'reel',
  author: { first_name: 'Ana', last_name: 'R' },
  media: [{ kind: 'video', status: 'ready', hls_url: `https://v/${id}.m3u8`, thumbnail_url: `https://t/${id}.jpg`, blurhash: 'L0', duration_ms: 15000, ...media }],
  ...over,
});

describe('reelStripItems', () => {
  it('the ready reels in feed order, as tiles', () => {
    const items = reelStripItems([{ posts: [reel('a'), reel('b')] }, { posts: [reel('c')] }]);
    assert.deepEqual(items.map((i) => i.id), ['a', 'b', 'c']);
    assert.deepEqual(items[0], { id: 'a', thumb: 'https://t/a.jpg', blurhash: 'L0', durationMs: 15000, authorName: 'Ana R' });
  });

  it('a reel still processing, a photo post or a repeat is left out', () => {
    const items = reelStripItems([{ posts: [reel('a', {}, { status: 'processing' }), { id: 'p', kind: 'image', media: [] }, reel('b'), reel('b')] }]);
    assert.deepEqual(items.map((i) => i.id), ['b']);
  });

  it('at most REEL_STRIP_MAX tiles; no pages, no tiles', () => {
    const many = Array.from({ length: 25 }, (_, i) => reel(`r${i}`));
    assert.equal(reelStripItems([{ posts: many }]).length, REEL_STRIP_MAX);
    assert.deepEqual(reelStripItems(undefined), []);
  });
});

describe('reel strip strings exist in both languages', () => {
  const load = (locale: string) =>
    JSON.parse(readFileSync(new URL(`../../i18n/locales/${locale}/translation.json`, import.meta.url), 'utf8'));
  for (const locale of ['en-US', 'ar-SA']) {
    it(locale, () => {
      const home = load(locale).home;
      for (const key of ['reelsTitle', 'reelsSeeAll', 'openReel']) assert.equal(typeof home[key], 'string', `${locale} home.${key}`);
    });
  }
});
