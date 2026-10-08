import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  MATCH_STAT_TYPES,
  SEASON_ROW_KEYS,
  matchStatKey,
  pollView,
  statShares,
  combinedState,
  summaryPollMs,
} from '../matchCenter.core.ts';

/**
 * The match screen's tabs show only what the API sent. These helpers decide
 * the bar widths, which statistic rows have a translated label, and what the
 * fan poll offers to whom.
 */
describe('statShares', () => {
  it('splits a pair of numbers into bar widths', () => {
    assert.deepEqual(statShares(9, 3), { home: 75, away: 25 });
  });

  it('reads a percentage string as its number', () => {
    assert.deepEqual(statShares('58%', '42%'), { home: 58, away: 42 });
  });

  it('a missing side counts as nothing, and two zeros draw no bar', () => {
    assert.deepEqual(statShares(4, null), { home: 100, away: 0 });
    assert.equal(statShares(0, 0), null);
    assert.equal(statShares(null, null), null);
    assert.equal(statShares('n/a', 'x'), null);
  });
});

describe('matchStatKey', () => {
  it('names a known statistic, and drops one the app has no label for', () => {
    assert.equal(matchStatKey('Ball Possession'), 'match.center.stat.possession');
    assert.equal(matchStatKey('expected_goals'), 'match.center.stat.xg');
    assert.equal(matchStatKey('Some New Stat'), null);
  });
});

describe('pollView', () => {
  const tally = (over: object = {}) => ({ counts: { home: 0, draw: 0, away: 0 }, percentages: { home: 0, draw: 0, away: 0 }, total: 0, mine: null, open: true, ...over });

  it('a signed-in fan who has not voted sees the buttons, not the results', () => {
    assert.deepEqual(pollView(tally(), true), { canVote: true, showResults: false, askSignIn: false });
  });

  it('after voting the results show, and the vote can still be changed before kickoff', () => {
    assert.deepEqual(pollView(tally({ mine: 'home', total: 1 }), true), { canVote: true, showResults: true, askSignIn: false });
  });

  it('signed out: the results show with a sign-in prompt', () => {
    assert.deepEqual(pollView(tally({ total: 3 }), false), { canVote: false, showResults: true, askSignIn: true });
  });

  it('after kickoff nobody can vote and there is no prompt', () => {
    assert.deepEqual(pollView(tally({ open: false, total: 3 }), false), { canVote: false, showResults: true, askSignIn: false });
    assert.deepEqual(pollView(tally({ open: false }), true), { canVote: false, showResults: true, askSignIn: false });
  });
});

describe('combinedState', () => {
  // A tab that also needs the header's summary is loading while either loads,
  // and failed (with a retry) when either failed: never "no data" meanwhile.
  const q = (isPending: boolean, isError: boolean) => ({ isPending, isError });
  it('is loading while either query loads', () => {
    assert.deepEqual(combinedState(q(false, false), q(true, false)), { isPending: true, isError: false });
  });
  it('has failed when either failed', () => {
    assert.deepEqual(combinedState(q(false, false), q(false, true)), { isPending: false, isError: true });
    assert.deepEqual(combinedState(q(false, true), q(true, false)), { isPending: false, isError: true });
  });
  it('is ready when both are', () => {
    assert.deepEqual(combinedState(q(false, false), q(false, false)), { isPending: false, isError: false });
  });
});

describe('summaryPollMs', () => {
  const now = Date.parse('2026-10-10T12:00:00Z');
  const m = (state: string, date: string) => ({ state, date }) as const;
  it('polls every minute while live', () => {
    assert.equal(summaryPollMs(m('live', '2026-10-10T11:00:00Z'), now), 60_000);
  });
  it('polls every minute in the two hours before kickoff, and after a delayed kickoff', () => {
    assert.equal(summaryPollMs(m('upcoming', '2026-10-10T13:30:00Z'), now), 60_000);
    assert.equal(summaryPollMs(m('upcoming', '2026-10-10T11:55:00Z'), now), 60_000);
  });
  it('does not poll a match days away, or a finished one', () => {
    assert.equal(summaryPollMs(m('upcoming', '2026-10-12T19:00:00Z'), now), false);
    assert.equal(summaryPollMs(m('finished', '2026-10-09T19:00:00Z'), now), false);
    assert.equal(summaryPollMs(undefined, now), false);
  });
});

describe('every label exists in both languages', () => {
  const load = (locale: string) =>
    JSON.parse(readFileSync(new URL(`../../i18n/locales/${locale}/translation.json`, import.meta.url), 'utf8'));
  for (const locale of ['en-US', 'ar-SA']) {
    it(locale, () => {
      const center = load(locale).match.center;
      for (const type of MATCH_STAT_TYPES) {
        const key = matchStatKey(type)!.split('.').at(-1)!;
        assert.equal(typeof center.stat[key], 'string', `${locale} match.center.stat.${key}`);
      }
      for (const key of SEASON_ROW_KEYS) assert.equal(typeof center.season[key], 'string', `${locale} match.center.season.${key}`);
      for (const tab of ['details', 'predictions', 'lineups', 'h2h', 'form', 'stats']) {
        assert.equal(typeof load(locale).match.tabs[tab], 'string', `${locale} match.tabs.${tab}`);
      }
    });
  }
});
