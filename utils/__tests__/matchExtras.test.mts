/**
 * Player ratings, Add to calendar and the kickoff reminder on the match
 * screen: the pure rules.
 *
 * Run with:  node --test utils/__tests__/matchExtras.test.mts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
  REMINDER_OFFSETS,
  calendarTemplateUrl,
  ratingBand,
  ratingIndex,
  reminderFireAt,
  reminderPlan,
  topRated,
} from '../matchExtras.core.ts';

const rated = (id: number, rating: number, minutes = 90) => ({ id, name: `P${id}`, photo: null, rating, minutes, pos: 'M', sub: false });

describe('ratings', () => {
  it('bands: 8 and up is great, 7 good, 6 fair, below that poor', () => {
    assert.equal(ratingBand(8), 'great');
    assert.equal(ratingBand(7.9), 'good');
    assert.equal(ratingBand(6), 'fair');
    assert.equal(ratingBand(5.9), 'poor');
  });

  it('topRated: the best across both sides, with the side, at most n', () => {
    const top = topRated({ home: [rated(1, 7.1), rated(2, 8.4)], away: [rated(9, 7.6)] }, 2);
    assert.deepEqual(top.map((p) => [p.id, p.side]), [[2, 'home'], [9, 'away']]);
    assert.deepEqual(topRated(undefined, 3), []);
  });

  it('ratingIndex: a player\'s rating by id, for the lineup rows', () => {
    const idx = ratingIndex({ home: [rated(1, 7.1)], away: [rated(9, 6.4)] });
    assert.equal(idx.get(1), 7.1);
    assert.equal(idx.get(9), 6.4);
    assert.equal(idx.get(5), undefined);
    assert.equal(ratingIndex(undefined).size, 0);
  });
});

describe('calendarTemplateUrl', () => {
  it('a Google Calendar event for the kick-off, two hours long', () => {
    const url = new URL(calendarTemplateUrl({
      id: 77, date: '2026-10-25T15:15:00+00:00',
      home: { name: 'Real Madrid' }, away: { name: 'Barcelona' },
      league: { name: 'La Liga', round: 'Regular Season - 10' }, venue: { name: 'Bernabéu', city: 'Madrid' },
    })!);
    assert.equal(url.origin + url.pathname, 'https://calendar.google.com/calendar/render');
    assert.equal(url.searchParams.get('action'), 'TEMPLATE');
    assert.equal(url.searchParams.get('text'), 'Real Madrid vs Barcelona');
    assert.equal(url.searchParams.get('dates'), '20261025T151500Z/20261025T171500Z');
    assert.equal(url.searchParams.get('location'), 'Bernabéu, Madrid');
    assert.equal(url.searchParams.get('details'), 'La Liga · Regular Season - 10');
  });
  it('no kick-off time, no link', () => {
    assert.equal(calendarTemplateUrl({ id: 1, date: null, home: { name: 'A' }, away: { name: 'B' } }), null);
  });
});

describe('kickoff reminder', () => {
  const kickoff = '2026-10-25T15:15:00Z';
  const now = new Date('2026-10-25T10:00:00Z');

  it('offers an hour before, 15 minutes before and at kickoff', () => {
    assert.deepEqual([...REMINDER_OFFSETS], [60, 15, 0]);
  });

  it('fires the chosen minutes before kickoff; a time already past is no reminder', () => {
    assert.equal(reminderFireAt(kickoff, 60, now)?.toISOString(), '2026-10-25T14:15:00.000Z');
    assert.equal(reminderFireAt(kickoff, 0, now)?.toISOString(), '2026-10-25T15:15:00.000Z');
    assert.equal(reminderFireAt(kickoff, 60, new Date('2026-10-25T14:20:00Z')), null);
    assert.equal(reminderFireAt('nope', 15, now), null);
  });

  it('reminderPlan: keep it while kickoff stands, move it when kickoff moved, drop it once it can no longer fire', () => {
    const saved = { notificationId: 'n1', offsetMin: 15, kickoff };
    assert.equal(reminderPlan(saved, kickoff, now), 'keep');
    assert.equal(reminderPlan(saved, '2026-10-25T18:00:00Z', now), 'reschedule');
    assert.equal(reminderPlan(saved, '2026-10-25T10:05:00Z', now), 'drop');
    assert.equal(reminderPlan(null, kickoff, now), 'none');
  });
});

describe('match extras strings exist in both languages', () => {
  const load = (locale: string) =>
    JSON.parse(readFileSync(new URL(`../../i18n/locales/${locale}/translation.json`, import.meta.url), 'utf8'));
  for (const locale of ['en-US', 'ar-SA']) {
    it(locale, () => {
      const c = load(locale).match.center;
      for (const key of [
        'topRated', 'ratingsSource', 'ratingA11y',
        'reminderTitle', 'reminder60', 'reminder15', 'reminder0', 'addToCalendar', 'reminderOff', 'reminderSet',
        'reminderDenied', 'reminderPast', 'reminderBody', 'reminderNow', 'reminderButton', 'reminderOn', 'reminderChannel', 'openSettings',
        'previewTitle', 'previewBadge', 'previewSource', 'previewHidden',
      ]) {
        assert.equal(typeof c[key], 'string', `${locale} match.center.${key}`);
      }
    });
  }
});
