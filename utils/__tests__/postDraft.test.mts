import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { DRAFT_VERSION, draftKey, isDraftEmpty, parseDraft, serializeDraft, unreferencedFiles, type PostDraft } from '../postDraft.core.ts';

/**
 * A new post in progress is kept on the phone, per account, so closing the
 * composer (or the app) does not lose it. What comes back from storage is
 * checked: a draft from another version, or a broken one, is dropped rather
 * than half-restored.
 */
const draft = (over: Partial<PostDraft> = {}): PostDraft => ({
  v: DRAFT_VERSION,
  savedAt: '2026-10-09T18:00:00.000Z',
  title: 'Hala',
  body: 'Madrid',
  location: '',
  audience: 'public',
  feeling: null,
  tagged: [],
  country: null,
  fanClub: null,
  postAsFanClub: false,
  media: [],
  ...over,
});

describe('draftKey', () => {
  it('one draft per account', () => {
    assert.equal(draftKey('u1'), 'casa_post_draft:u1');
    assert.notEqual(draftKey('u1'), draftKey('u2'));
  });
});

describe('serializeDraft / parseDraft', () => {
  it('a draft round-trips, stamped with the time it was saved', () => {
    const now = new Date('2026-10-09T19:00:00Z');
    const back = parseDraft(serializeDraft(draft({ media: [{ uri: 'file:///d/a.jpg', kind: 'image', mime: 'image/jpeg', width: 10, height: 20, durationMs: null, sizeBytes: 5 }] }), now));
    assert.equal(back?.title, 'Hala');
    assert.equal(back?.savedAt, now.toISOString());
    assert.equal(back?.media[0].uri, 'file:///d/a.jpg');
  });
  it('nothing, junk, or another version gives no draft', () => {
    assert.equal(parseDraft(null), null);
    assert.equal(parseDraft('not json'), null);
    assert.equal(parseDraft(JSON.stringify({ ...draft(), v: DRAFT_VERSION + 1 })), null);
    assert.equal(parseDraft(JSON.stringify({ ...draft(), title: 42 })), null);
  });
  it('a media entry without a file or a known kind is dropped, the rest kept', () => {
    const raw = JSON.stringify(draft({ media: [{ uri: '', kind: 'image' } as never, { uri: 'file:///d/b.mp4', kind: 'gif' } as never, { uri: 'file:///d/c.jpg', kind: 'image', mime: 'image/jpeg' } as never] }));
    assert.deepEqual(parseDraft(raw)?.media.map((m) => m.uri), ['file:///d/c.jpg']);
  });
  it('an unknown audience reads as public', () => {
    assert.equal(parseDraft(JSON.stringify({ ...draft(), audience: 'everyone' }))?.audience, 'public');
  });
});

describe('isDraftEmpty', () => {
  it('nothing typed, picked or chosen is empty', () => {
    assert.equal(isDraftEmpty(draft({ title: ' ', body: '' })), true);
  });
  it('any content makes it a draft worth keeping', () => {
    assert.equal(isDraftEmpty(draft({ title: '', body: 'x' })), false);
    assert.equal(isDraftEmpty(draft({ title: '', body: '', feeling: 'happy' })), false);
    assert.equal(isDraftEmpty(draft({ title: '', body: '', media: [{ uri: 'file:///x.jpg', kind: 'image', mime: 'image/jpeg', width: null, height: null, durationMs: null, sizeBytes: null }] })), false);
  });
});

describe('draft strings exist in both languages', () => {
  const load = (locale: string) =>
    JSON.parse(readFileSync(new URL(`../../i18n/locales/${locale}/translation.json`, import.meta.url), 'utf8'));
  for (const locale of ['en-US', 'ar-SA']) {
    it(locale, () => {
      const c = load(locale).community.compose;
      for (const key of ['draftTitle', 'draftBody', 'draftContinue', 'draftDiscard']) {
        assert.equal(typeof c[key], 'string', `${locale} community.compose.${key}`);
      }
    });
  }
});

describe('unreferencedFiles', () => {
  it('files in the draft folder that the draft no longer uses', () => {
    const dir = 'file:///docs/post-drafts/u1/';
    const d = draft({
      media: [
        { uri: `${dir}a.jpg`, kind: 'image', mime: 'image/jpeg', width: null, height: null, durationMs: null, sizeBytes: null },
        { uri: `${dir}v.mp4`, kind: 'video', mime: 'video/mp4', width: null, height: null, durationMs: null, sizeBytes: null, thumbnailUri: `${dir}v.jpg` },
      ],
    });
    assert.deepEqual(unreferencedFiles(['a.jpg', 'old.jpg', 'v.mp4', 'v.jpg', 'gone.mp4'], dir, d), ['old.jpg', 'gone.mp4']);
  });
});

describe('a poll in a draft', () => {
  it('round-trips its options and length', () => {
    const back = parseDraft(serializeDraft(draft({ poll: { options: ['Vini', ''], days: 3 } })));
    assert.deepEqual(back?.poll, { options: ['Vini', ''], days: 3 });
  });
  it('a malformed poll is dropped, the rest of the draft kept', () => {
    const back = parseDraft(JSON.stringify({ ...draft(), poll: { options: 'Vini', days: 3 } }));
    assert.equal(back?.poll, null);
    assert.equal(back?.title, 'Hala');
  });
  it('a poll with any option typed is worth keeping', () => {
    assert.equal(isDraftEmpty(draft({ title: '', body: '', poll: { options: ['', 'x'], days: 1 } })), false);
    assert.equal(isDraftEmpty(draft({ title: '', body: '', poll: { options: ['', ''], days: 1 } })), true);
  });
});
