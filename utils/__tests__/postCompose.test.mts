import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { AUDIENCES, FEELINGS, MEDIA_EDIT_PROBLEMS, editPayload, feelingOf, mediaEditPlan, mediaEditable, overallProgress } from '../postCompose.core.ts';

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
        'mediaUnderReview', 'mediaEditNotice', 'removeMedia', 'mediaEditFailed', 'tryAgain', 'cancelUpload',
      ]) {
        assert.equal(typeof c[key], 'string', `${locale} community.compose.${key}`);
      }
      for (const problem of MEDIA_EDIT_PROBLEMS) {
        assert.equal(typeof c.mediaEditProblem?.[problem], 'string', `${locale} community.compose.mediaEditProblem.${problem}`);
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

describe('mediaEditable', () => {
  // The server's rule (mediaEditRules.mediaEditRefusal): your own approved
  // photo or video post. The composer only offers the change when it would pass.
  const post = (over: Record<string, unknown> = {}) => ({ kind: 'image', status: 'approved', author_type: 'user', ...over });
  it('an approved photo or video post of your own', () => {
    assert.equal(mediaEditable(post()), true);
    assert.equal(mediaEditable(post({ kind: 'video' })), true);
  });
  it('not a post under review, a text post, a poll, a teaser, or a fan club post', () => {
    assert.equal(mediaEditable(post({ status: 'pending' })), false);
    for (const kind of ['text', 'poll', 'media_teaser']) assert.equal(mediaEditable(post({ kind })), false, kind);
    assert.equal(mediaEditable(post({ author_type: 'fan_club' })), false);
  });
});

describe('mediaEditPlan', () => {
  const ids = (...list: string[]) => list.map((id) => ({ id }));

  it('nothing changed is no edit', () => {
    assert.deepEqual(mediaEditPlan('image', ids('a', 'b'), ids('a', 'b'), 0), { remove: [], add: 0, changed: false, review: false, problem: null });
  });

  it('removing photos only: the post stays live', () => {
    assert.deepEqual(mediaEditPlan('image', ids('a', 'b', 'c'), ids('a', 'c'), 0), { remove: ['b'], add: 0, changed: true, review: false, problem: null });
  });

  it('adding photos sends the post back to review', () => {
    const plan = mediaEditPlan('image', ids('a'), ids('a'), 2);
    assert.deepEqual(plan, { remove: [], add: 2, changed: true, review: true, problem: null });
  });

  it('a photo post keeps 1 to 10 photos', () => {
    assert.equal(mediaEditPlan('image', ids('a'), [], 0).problem, 'media_required');
    assert.equal(mediaEditPlan('image', ids('a', 'b'), ids('a', 'b'), 9).problem, 'too_many_media');
    assert.equal(mediaEditPlan('image', ids('a'), [], 1).problem, null);
  });

  it('a video post swaps its one video for one new one', () => {
    assert.deepEqual(mediaEditPlan('video', ids('v'), [], 1), { remove: ['v'], add: 1, changed: true, review: true, problem: null });
    assert.equal(mediaEditPlan('video', ids('v'), [], 0).problem, 'one_video', 'the old one removed, no new one yet');
    assert.equal(mediaEditPlan('video', ids('v'), ids('v'), 1).problem, 'one_video');
  });

  it('every problem has a name the strings use', () => {
    assert.deepEqual([...MEDIA_EDIT_PROBLEMS], ['media_required', 'too_many_media', 'one_video']);
  });
});
