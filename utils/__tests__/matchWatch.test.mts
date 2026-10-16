/**
 * The match page's admin-entered extras in the app: where to watch, by
 * country, and the two clubs' trophies (backend matchExtrasController).
 *
 * Run with:  node --test utils/__tests__/matchWatch.test.mts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { TROPHY_ORDER, countryName, normaliseBroadcasts, normaliseTrophies } from '../matchWatch.core.ts';

describe('normaliseBroadcasts', () => {
  it('keeps your country, worldwide and the others, dropping anything malformed', () => {
    const out = normaliseBroadcasts({
      country: 'ES',
      here: [{ channel: 'Movistar', url: 'https://movistar.es' }, { channel: 7 }],
      worldwide: [{ channel: 'LaLiga+', url: null }],
      others: [{ country_code: 'AE', channels: [{ channel: 'beIN', url: 'javascript:x' }] }, { country_code: 9, channels: [] }],
    });
    assert.deepEqual(out, {
      country: 'ES',
      here: [{ channel: 'Movistar', url: 'https://movistar.es' }],
      worldwide: [{ channel: 'LaLiga+', url: null }],
      others: [{ country_code: 'AE', channels: [{ channel: 'beIN', url: null }] }],
    });
  });
  it('nothing to show is null, so the card hides', () => {
    assert.equal(normaliseBroadcasts(null), null);
    assert.equal(normaliseBroadcasts({ country: null, here: [], worldwide: [], others: [] }), null);
  });
});

describe('normaliseTrophies', () => {
  it('the two clubs and the competitions in the fixed order', () => {
    const out = normaliseTrophies({
      home: { team_id: 541, name: 'Real Madrid', logo: 'h.png' },
      away: { team_id: 529, name: 'Barcelona', logo: null },
      rows: [{ competition: 'champions_league', home: 15, away: 5 }, { competition: 'league', home: 36, away: 27 }, { competition: 'world_cup', home: 1, away: 0 }],
      totals: { home: 51, away: 32 },
      updated_at: '2026-10-16T10:00:00Z',
    });
    assert.deepEqual(out?.rows.map((r) => r.competition), ['league', 'champions_league']);
    assert.equal(out?.home.name, 'Real Madrid');
    assert.equal(out?.updatedAt, '2026-10-16T10:00:00Z');
    assert.deepEqual(out?.totals, { home: 51, away: 32 });
  });
  it('no rows is null', () => {
    assert.equal(normaliseTrophies({ home: {}, away: {}, rows: [] }), null);
    assert.equal(normaliseTrophies(null), null);
  });
  it('the competitions, in the order the card lists them', () => {
    assert.deepEqual([...TROPHY_ORDER], ['league', 'domestic_cup', 'super_cup', 'champions_league', 'europa_league', 'uefa_super_cup', 'club_world_cup']);
  });
});

describe('countryName', () => {
  it('a country by its name in the app language, its code when unknown', () => {
    assert.equal(countryName('ES', 'en'), 'Spain');
    assert.equal(countryName('XX', 'en'), 'XX');
  });
});

describe('match extras strings exist in both languages', () => {
  const load = (locale: string) =>
    JSON.parse(readFileSync(new URL(`../../i18n/locales/${locale}/translation.json`, import.meta.url), 'utf8'));
  for (const locale of ['en-US', 'ar-SA']) {
    it(locale, () => {
      const c = load(locale).match.center;
      for (const key of ['watchTitle', 'watchHere', 'watchWorldwide', 'watchOthers', 'watchOthersShow', 'trophiesTitle', 'trophiesTotal', 'trophiesSource']) {
        assert.equal(typeof c[key], 'string', `${locale} match.center.${key}`);
      }
      for (const k of TROPHY_ORDER) assert.equal(typeof c.trophy?.[k], 'string', `${locale} match.center.trophy.${k}`);
    });
  }
});
