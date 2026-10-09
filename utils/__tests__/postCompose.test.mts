import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { AUDIENCES, FEELINGS, editPayload, feelingOf, overallProgress } from '../postCompose.core.ts';

/**
 * The composer's new settings (spec 2.1.0 §03): who a post is for, a feeling
 * or activity, and what an edit sends. The backend (services/postRules.js)
 * holds the same keys and refuses anything else.
 */
describe('FEELINGS', () => {
  it('the same twelve keys the server accepts', () => {
    assert.deepEqual(
      FEELINGS.map((f) => f.key),
      ['happy', 'excited', 'proud', 'grateful', 'hopeful', 'nervous', 'sad', 'angry', 'watching_match', 'at_stadium', 'celebrating', 'travelling'],
    );
  });
  it('each has an emoji and is a feeling or an activity', () => {
    for (const f of FEELINGS) {
      assert.ok(f.emoji.length > 0, f.key);
      assert.ok(['feeling', 'activity'].includes(f.kind), f.key);
    }
  });
  it('feelingOf finds a known key and nothing else', () => {
    assert.equal(feelingOf('proud')?.emoji.length > 0, true);
    assert.equal(feelingOf('watching_match')?.kind, 'activity');
    assert.equal(feelingOf('ecstatic'), null);
    assert.equal(feelingOf(null), null);
  });
});

describe('editPayload', () => {
  const original = {
    title: 'Hala',
    body: 'Madrid',
    location_name: null,
    audience: 'public' as const,
    feeling: null,
    tagged: [{ id: 'a' }, { id: 'b' }],
  };
  const draft = { title: 'Hala', body: 'Madrid', location: '', audience: 'public' as const, feeling: null, taggedIds: ['b', 'a'] };

  it('nothing changed sends nothing', () => {
    assert.deepEqual(editPayload(original, draft), {});
  });
  it('sends only what changed, trimmed', () => {
    assert.deepEqual(editPayload(original, { ...draft, body: ' Madrid! ', audience: 'friends', feeling: 'happy' }), {
      body: 'Madrid!',
      audience: 'friends',
      feeling: 'happy',
    });
  });
  it('a cleared location is sent as null, a new one trimmed', () => {
    assert.deepEqual(editPayload({ ...original, location_name: 'Bernabéu' }, { ...draft, location: '  ' }), { location_name: null });
    assert.deepEqual(editPayload(original, { ...draft, location: ' Madrid ' }), { location_name: 'Madrid' });
  });
  it('tagged people are sent only when the set changed', () => {
    assert.deepEqual(editPayload(original, { ...draft, taggedIds: ['a'] }), { tagged_user_ids: ['a'] });
    assert.deepEqual(editPayload(original, { ...draft, taggedIds: [] }), { tagged_user_ids: [] });
  });
  it('removing a feeling sends null', () => {
    assert.deepEqual(editPayload({ ...original, feeling: 'sad' }, draft), { feeling: null });
  });
  it('country and fan club tags are sent only when they changed', () => {
    const tagged = { ...original, country_code: 'ES', tagged_fan_club_id: 'club-1' };
    const same = { ...draft, countryCode: 'ES', fanClubId: 'club-1' };
    assert.deepEqual(editPayload(tagged, same), {});
    assert.deepEqual(editPayload(tagged, { ...same, countryCode: 'AE', fanClubId: null }), {
      country_code: 'AE',
      tagged_fan_club_id: null,
    });
  });
  it('a draft that never touched the tags leaves them alone', () => {
    assert.deepEqual(editPayload({ ...original, country_code: 'ES', tagged_fan_club_id: 'club-1' }, draft), {});
  });
});

describe('AUDIENCES', () => {
  it('public first: the default', () => {
    assert.deepEqual(AUDIENCES, ['public', 'friends']);
  });
});

describe('every composer label exists in both languages', () => {
  const load = (locale: string) =>
    JSON.parse(readFileSync(new URL(`../../i18n/locales/${locale}/translation.json`, import.meta.url), 'utf8'));
  for (const locale of ['en-US', 'ar-SA']) {
    it(locale, () => {
      const c = load(locale).community.compose;
      for (const a of AUDIENCES) assert.equal(typeof c.audience[a], 'string', `${locale} community.compose.audience.${a}`);
      for (const f of FEELINGS) assert.equal(typeof c.feeling[f.key], 'string', `${locale} community.compose.feeling.${f.key}`);
      for (const key of [
        'audienceLabel', 'feelingLabel', 'feelingNone', 'feelingTitle', 'feelingLine', 'activityLine',
        'preview', 'previewTitle', 'keepEditing', 'post', 'editTitle', 'save', 'saved', 'mediaLocked',
        'reviewNote', 'edited', 'friendsOnly', 'editAction',
      ]) {
        assert.equal(typeof c[key], 'string', `${locale} community.compose.${key}`);
      }
    });
  }
});

describe('overallProgress', () => {
  it('spreads the bar evenly across the files, one at a time', () => {
    assert.equal(overallProgress(0, 0, 4), 0);
    assert.equal(overallProgress(0, 0.5, 4), 0.125);
    assert.equal(overallProgress(2, 0, 4), 0.5);
    assert.equal(overallProgress(3, 1, 4), 1);
  });
  it('never leaves 0..1, whatever it is fed', () => {
    assert.equal(overallProgress(0, 2, 1), 1);
    assert.equal(overallProgress(0, -1, 1), 0);
    assert.equal(overallProgress(0, Number.NaN, 2), 0);
    assert.equal(overallProgress(0, 0.5, 0), 0);
  });
});
