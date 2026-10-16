/**
 * A post's Insights as the app reads them: a wire answer folded into safe
 * numbers, and the 30-day bar heights.
 *
 * Run with:  node --test utils/__tests__/postInsights.test.mts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { SHARE_CHANNELS, barHeights, normaliseInsights, pinErrorKey, stackedBars } from '../postInsights.core.ts';

const WIRE = {
  totals: { views: 40, unique_viewers: 25, opens: 9, likes: 12, comments: 3, saves: 2, shares: 3, web_views: 6 },
  shares_by_channel: { native_share: 0, copy_link: 1, qr: 0, dm: 2, save: 0 },
  series: [{ day: '2026-10-12', views: 5, web_views: 0 }, { day: '2026-10-13', views: 7, web_views: 6 }],
  tracked_since: '2026-10-13',
};

describe('normaliseInsights', () => {
  it('keeps the numbers, every channel in order, the series and the start date', () => {
    const out = normaliseInsights(WIRE);
    assert.deepEqual(out.totals, WIRE.totals);
    assert.deepEqual(out.channels, SHARE_CHANNELS.map((c) => ({ channel: c, count: WIRE.shares_by_channel[c] })));
    assert.deepEqual(out.series, WIRE.series);
    assert.equal(out.trackedSince, '2026-10-13');
  });

  it('a missing or broken answer is zeros, never a crash', () => {
    const out = normaliseInsights({ totals: { views: 'x', likes: -2 }, series: [{ day: 3 }, null] });
    assert.equal(out.totals.views, 0);
    assert.equal(out.totals.likes, 0);
    assert.deepEqual(out.series, []);
    assert.equal(out.channels.every((c) => c.count === 0), true);
    assert.equal(normaliseInsights(null).trackedSince, null);
  });

  it('an answer from before web link views reads them as zero', () => {
    const out = normaliseInsights({ totals: { views: 2 }, series: [{ day: '2026-10-13', views: 2 }] });
    assert.equal(out.totals.web_views, 0);
    assert.deepEqual(out.series, [{ day: '2026-10-13', views: 2, web_views: 0 }]);
  });
});

describe('barHeights', () => {
  it('scales to the tallest day; a day with views is never invisible', () => {
    assert.deepEqual(barHeights([{ views: 10 }, { views: 5 }, { views: 1 }, { views: 0 }], 40), [40, 20, 4, 0]);
    assert.deepEqual(barHeights([{ views: 100 }, { views: 1 }], 40), [40, 2], 'at least 2 px');
  });
  it('no views at all is a flat row', () => {
    assert.deepEqual(barHeights([{ views: 0 }, { views: 0 }], 40), [0, 0]);
  });
});

describe('stackedBars', () => {
  it('app views at the bottom, web link views on top, scaled to the tallest day', () => {
    assert.deepEqual(
      stackedBars([{ views: 10, web_views: 10 }, { views: 5, web_views: 0 }, { views: 0, web_views: 1 }, { views: 0, web_views: 0 }], 40),
      [{ app: 20, web: 20 }, { app: 10, web: 0 }, { app: 0, web: 2 }, { app: 0, web: 0 }],
    );
  });
  it('a part with views is never invisible', () => {
    assert.deepEqual(stackedBars([{ views: 100, web_views: 1 }], 40), [{ app: 40, web: 2 }]);
  });
});

describe('pinErrorKey', () => {
  it('names the limit, a post not yet approved, or a generic failure', () => {
    assert.equal(pinErrorKey('pin_limit'), 'community.pin.limit');
    assert.equal(pinErrorKey('post_not_pinnable'), 'community.pin.notApproved');
    assert.equal(pinErrorKey('Failed'), 'community.pin.failed');
  });
});

describe('pin and insights strings exist in both languages', () => {
  const load = (locale: string) =>
    JSON.parse(readFileSync(new URL(`../../i18n/locales/${locale}/translation.json`, import.meta.url), 'utf8'));
  for (const locale of ['en-US', 'ar-SA']) {
    it(locale, () => {
      const all = load(locale);
      const pin = all.community.pin;
      for (const key of ['pin', 'unpin', 'limit', 'notApproved', 'failed']) assert.equal(typeof pin[key], 'string', `${locale} community.pin.${key}`);
      for (const code of ['pin_limit', 'post_not_pinnable', 'other']) {
        const [, , leaf] = pinErrorKey(code).split('.');
        assert.equal(typeof pin[leaf], 'string', `${locale} ${pinErrorKey(code)}`);
      }
      const ins = all.community.insights;
      for (const key of ['title', 'open', 'loadFailed', 'reach', 'views', 'people', 'opens', 'trackedSince', 'last30', 'engagement', 'likes', 'comments', 'saves', 'shares', 'sharesBy', 'ownViews', 'webViews', 'webNote', 'legendApp', 'legendWeb']) {
        assert.equal(typeof ins[key], 'string', `${locale} community.insights.${key}`);
      }
      for (const c of SHARE_CHANNELS) assert.equal(typeof ins.channel[c], 'string', `${locale} community.insights.channel.${c}`);
      const forms = locale === 'ar-SA' ? ['zero', 'one', 'two', 'few', 'many', 'other'] : ['one', 'other'];
      for (const f of forms) assert.equal(typeof ins[`chartLabel_${f}`], 'string', `${locale} chartLabel_${f}`);
      assert.equal(typeof all.social.profile.grid.pinned, 'string');
    });
  }
});
