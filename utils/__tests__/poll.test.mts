import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { POLL_DURATIONS, POLL_OPTIONS_MAX, closesIn, pollState, validatePollDraft } from '../poll.core.ts';

/**
 * Poll posts (spec 2.1.0 §03). The composer checks a poll the same way the
 * server does (services/pollRules.js) so Post is only enabled for one the
 * server will take; the card decides what a viewer can do and see.
 */
describe('validatePollDraft', () => {
  it('2 to 4 filled, distinct options of at most 80 characters', () => {
    assert.deepEqual(validatePollDraft(['Vini', ' Mbappé '], 3), { ok: true, options: ['Vini', 'Mbappé'] });
    assert.equal(validatePollDraft(['Only'], 3).ok, false);
    assert.equal(validatePollDraft(['a', 'A '], 3).ok, false);
    assert.equal(validatePollDraft(['a', ''], 3).ok, false);
    assert.equal(validatePollDraft(['a', 'x'.repeat(81)], 3).ok, false);
    assert.equal(validatePollDraft(['a', 'b', 'c', 'd', 'e'], 3).ok, false);
  });
  it('1, 3 or 7 days', () => {
    assert.deepEqual([...POLL_DURATIONS], [1, 3, 7]);
    assert.equal(validatePollDraft(['a', 'b'], 2).ok, false);
  });
  it('at most four options', () => {
    assert.equal(POLL_OPTIONS_MAX, 4);
  });
});

describe('pollState', () => {
  const open = { mine: null, open: true, total: null };
  it('a signed-in fan who has not voted can vote and sees no results yet', () => {
    assert.deepEqual(pollState(open, { signedIn: true }), { canVote: true, showResults: false, askSignIn: false });
  });
  it('a signed-out reader is asked to sign in', () => {
    assert.deepEqual(pollState(open, { signedIn: false }), { canVote: false, showResults: false, askSignIn: true });
  });
  it('after voting the results show and the vote can still change', () => {
    assert.deepEqual(pollState({ mine: 'a', open: true, total: 3 }, { signedIn: true }), { canVote: true, showResults: true, askSignIn: false });
  });
  it('a closed poll shows results to everyone and takes no votes', () => {
    assert.deepEqual(pollState({ mine: null, open: false, total: 3 }, { signedIn: false }), { canVote: false, showResults: true, askSignIn: false });
  });
  it('the author sees results the server sent before voting', () => {
    assert.equal(pollState({ mine: null, open: true, total: 0 }, { signedIn: true }).showResults, true);
  });
});

describe('closesIn', () => {
  const now = new Date('2026-10-09T12:00:00Z');
  it('days, then hours, then minutes, or closed', () => {
    assert.deepEqual(closesIn('2026-10-12T12:00:00Z', now), { unit: 'days', count: 3 });
    assert.deepEqual(closesIn('2026-10-09T17:30:00Z', now), { unit: 'hours', count: 5 });
    assert.deepEqual(closesIn('2026-10-09T12:20:00Z', now), { unit: 'minutes', count: 20 });
    assert.equal(closesIn('2026-10-09T11:00:00Z', now), null);
  });
});

describe('poll strings exist in both languages', () => {
  const load = (locale: string) =>
    JSON.parse(readFileSync(new URL(`../../i18n/locales/${locale}/translation.json`, import.meta.url), 'utf8'));
  for (const locale of ['en-US', 'ar-SA']) {
    it(locale, () => {
      const p = load(locale).community.poll;
      for (const key of [
        'add', 'remove', 'optionPlaceholder', 'addOption', 'duration', 'yourVote',
        'final', 'closed', 'failed', 'signIn', 'locked', 'label', 'voteA11y', 'noMedia', 'removeOption', 'durationNote',
      ]) {
        assert.equal(typeof p[key], 'string', `${locale} community.poll.${key}`);
      }
      // Counts read "1 vote", "2 votes": plural forms, all of Arabic's six.
      const forms = locale === 'ar-SA' ? ['zero', 'one', 'two', 'few', 'many', 'other'] : ['one', 'other'];
      for (const base of ['votes', 'days', 'closesInDays', 'closesInHours', 'closesInMinutes']) {
        assert.equal(typeof p[base], 'undefined', `${locale} community.poll.${base} is plural`);
        for (const f of forms) assert.equal(typeof p[`${base}_${f}`], 'string', `${locale} community.poll.${base}_${f}`);
      }
    });
  }
});
