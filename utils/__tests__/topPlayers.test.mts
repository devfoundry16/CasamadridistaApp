import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  POSITIONS,
  STAT_GROUPS,
  STAT_KEYS,
  TEAM_STAT_KEYS,
  canOpenPlayer,
  cardParams,
  keepWhileSameBoard,
  formatLeaderValue,
  leaderParams,
  minMinutesOf,
  unitSuffixKey,
  visibleStats,
} from '../topPlayers.core.ts';

/**
 * Top Players shows only what the provider sent. These helpers format each
 * value with its unit, decide which stat cards appear for a search or a group,
 * and build the query the leaderboard endpoints read.
 */
describe('formatLeaderValue', () => {
  it('counts are whole numbers', () => {
    assert.equal(formatLeaderValue(9, 'count'), '9');
  });
  it('per-90 and per-game values keep two decimals', () => {
    assert.equal(formatLeaderValue(0.5, 'per90'), '0.50');
    assert.equal(formatLeaderValue(2.125, 'decimal'), '2.13');
  });
  it('ratings keep two decimals', () => {
    assert.equal(formatLeaderValue(7.1, 'rating'), '7.10');
  });
  it('percentages carry the sign, minutes are whole', () => {
    assert.equal(formatLeaderValue(87.6, 'percent'), '88%');
    assert.equal(formatLeaderValue(112.4, 'minutes'), '112');
  });
});

describe('unitSuffixKey', () => {
  it('names the unit only where the number alone would be unclear', () => {
    assert.equal(unitSuffixKey('minutes'), 'team.leaders.unit.minutes');
    assert.equal(unitSuffixKey('per90'), 'team.leaders.unit.per90');
    assert.equal(unitSuffixKey('decimal'), 'team.leaders.unit.perGame');
    assert.equal(unitSuffixKey('count'), null);
    assert.equal(unitSuffixKey('percent'), null);
    assert.equal(unitSuffixKey('rating'), null);
  });
});

describe('minMinutesOf', () => {
  it('shows a threshold only when one applies', () => {
    assert.equal(minMinutesOf({ threshold: 180 }), 180);
    assert.equal(minMinutesOf({ threshold: 0 }), null);
    assert.equal(minMinutesOf({ threshold: null }), null);
  });
});

describe('leaderParams', () => {
  it('sends only the filters that differ from the defaults', () => {
    assert.deepEqual(leaderParams({ scope: 'all', position: null, mode: 'total' }), {});
    assert.deepEqual(leaderParams({ scope: 'team', position: 'GK', mode: 'per90' }), {
      scope: 'team',
      position: 'GK',
      mode: 'per90',
    });
  });
  it('adds a trimmed search and a limit when given', () => {
    assert.deepEqual(leaderParams({ scope: 'all', position: null, mode: 'total', q: '  vini ', limit: 200 }), {
      q: 'vini',
      limit: '200',
    });
    assert.deepEqual(leaderParams({ scope: 'all', position: null, mode: 'total', q: '   ' }), {});
  });
});

describe('cardParams', () => {
  it('opens "See all" in the mode the card was ranked in, not the global toggle', () => {
    // Per 90 is on, but pass completion has no per-90 and was ranked in totals.
    assert.deepEqual(cardParams({ scope: 'team', position: null, mode: 'per90' }, 'total'), { scope: 'team' });
    assert.deepEqual(cardParams({ scope: 'all', position: 'FWD', mode: 'per90' }, 'per90'), { position: 'FWD', mode: 'per90' });
  });
});

describe('keepWhileSameBoard', () => {
  const prev = { status: 'ready' };
  it('keeps the old cards on screen while only a filter changes', () => {
    const keep = keepWhileSameBoard(140, 2026);
    assert.equal(keep(prev, { queryKey: ['football', 'leaders', 140, 2026, { mode: 'per90' }] }), prev);
  });
  it('never shows one competition or season under another', () => {
    assert.equal(keepWhileSameBoard(2, 2026)(prev, { queryKey: ['football', 'leaders', 140, 2026, {}] }), undefined);
    assert.equal(keepWhileSameBoard(140, 2025)(prev, { queryKey: ['football', 'leaders', 140, 2026, {}] }), undefined);
    assert.equal(keepWhileSameBoard(140, 2026)(undefined, undefined), undefined);
  });
});

describe('visibleStats', () => {
  const stats = [
    { key: 'goals', group: 'attack', available: true, entries: [{}] },
    { key: 'passes', group: 'passing', available: true, entries: [{}] },
    { key: 'best_match_rating', group: 'ratings', available: false, entries: [] },
    { key: 'saves', group: 'goalkeeping', available: true, entries: [] },
  ];
  const labels: Record<string, string> = { goals: 'Goals', passes: 'Passes', best_match_rating: 'Best match rating', saves: 'Saves' };
  const labelOf = (key: string) => labels[key];

  it('hides a stat the provider does not cover and a stat with nobody ranked', () => {
    assert.deepEqual(visibleStats(stats, { group: 'all', search: '', labelOf }).map((s) => s.key), ['goals', 'passes']);
  });
  it('keeps one group', () => {
    assert.deepEqual(visibleStats(stats, { group: 'passing', search: '', labelOf }).map((s) => s.key), ['passes']);
  });
  it('searches the translated labels, ignoring case and accents', () => {
    assert.deepEqual(visibleStats(stats, { group: 'all', search: 'GOÁL', labelOf }).map((s) => s.key), ['goals']);
  });
  it('searches Arabic labels', () => {
    const ar: Record<string, string> = { goals: 'الأهداف', passes: 'التمريرات' };
    assert.deepEqual(visibleStats(stats, { group: 'all', search: 'تمرير', labelOf: (k) => ar[k] ?? k }).map((s) => s.key), ['passes']);
  });
});

describe('canOpenPlayer', () => {
  it('only our own players have a player screen', () => {
    assert.equal(canOpenPlayer(541, 541), true);
    assert.equal(canOpenPlayer(529, 541), false);
    assert.equal(canOpenPlayer(null, 541), false);
  });
});

describe('every label exists in both languages', () => {
  const load = (locale: string) =>
    JSON.parse(readFileSync(new URL(`../../i18n/locales/${locale}/translation.json`, import.meta.url), 'utf8'));
  for (const locale of ['en-US', 'ar-SA']) {
    it(locale, () => {
      const leaders = load(locale).team.leaders;
      for (const key of STAT_KEYS) assert.equal(typeof leaders.stat[key], 'string', `${locale} team.leaders.stat.${key}`);
      for (const key of TEAM_STAT_KEYS) assert.equal(typeof leaders.teamStat[key], 'string', `${locale} team.leaders.teamStat.${key}`);
      for (const key of ['all', ...STAT_GROUPS]) assert.equal(typeof leaders.group[key], 'string', `${locale} team.leaders.group.${key}`);
      for (const key of POSITIONS) assert.equal(typeof leaders.position[key], 'string', `${locale} team.leaders.position.${key}`);
      for (const key of ['minutes', 'per90', 'perGame']) assert.equal(typeof leaders.unit[key], 'string', `${locale} team.leaders.unit.${key}`);
      for (const key of [
        'players', 'teams', 'scopeTeam', 'scopeAll', 'positionAll', 'modeTotal', 'modePer90',
        'searchStats', 'searchPlayers', 'searchTeams', 'seeAll', 'minMinutes', 'source', 'syncingTitle', 'syncingBody',
        'unavailableTitle', 'unavailableBody', 'noResults', 'versus',
      ]) {
        assert.equal(typeof leaders[key], 'string', `${locale} team.leaders.${key}`);
      }
      // Ratings are the provider's own model; never call them "SofaScore".
      assert.ok(!JSON.stringify(leaders).toLowerCase().includes('sofascore'), `${locale} mentions SofaScore`);
    });
  }
});
