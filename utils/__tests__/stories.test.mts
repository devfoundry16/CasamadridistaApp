/**
 * User stories in the app (Social, C1).
 *
 * Run with:  node --test utils/__tests__/stories.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { pickProblem, ringState, showForMs, step, uploadMimeType, videoProgress, nextAuthor } from '../stories.core.ts';

const g = (author: string, seen: boolean[]) => ({ author_id: author, all_seen: seen.every(Boolean), stories: seen.map((s, i) => ({ id: `${author}${i}`, seen: s })) });

describe('stories.core', () => {
  it('a profile ring is unseen while anything is unseen, seen when all are, none without stories', () => {
    assert.equal(ringState([{ seen: false }, { seen: true }]), 'unseen');
    assert.equal(ringState([{ seen: true }]), 'seen');
    assert.equal(ringState([]), null);
  });

  it('a picked video is at most 15 seconds and 50 MB; a photo at most 10 MB', () => {
    assert.equal(pickProblem({ type: 'video', durationMs: 15_000, fileSize: 1 }), null);
    assert.equal(pickProblem({ type: 'video', durationMs: 16_000, fileSize: 1 }), 'too_long');
    assert.equal(pickProblem({ type: 'video', durationMs: 5_000, fileSize: 60 * 1024 * 1024 }), 'too_large');
    assert.equal(pickProblem({ type: 'image', fileSize: 11 * 1024 * 1024 }), 'too_large');
    assert.equal(pickProblem({ type: 'image', fileSize: 1000 }), null);
  });

  it('a photo shows for 5 seconds, a video for its length', () => {
    assert.equal(showForMs({ kind: 'photo', duration_ms: null }), 5000);
    assert.equal(showForMs({ kind: 'video', duration_ms: 9000 }), 9000);
    assert.equal(showForMs({ kind: 'video', duration_ms: null }), 15000);
  });

  it('tapping forward walks a person\'s stories, then the next person, then closes', () => {
    const groups = [g('a', [false, false]), g('b', [false])];
    assert.deepEqual(step(groups, { group: 0, story: 0 }, 1), { group: 0, story: 1 });
    assert.deepEqual(step(groups, { group: 0, story: 1 }, 1), { group: 1, story: 0 });
    assert.equal(step(groups, { group: 1, story: 0 }, 1), 'close');
    assert.deepEqual(step(groups, { group: 1, story: 0 }, -1), { group: 0, story: 1 });
    assert.deepEqual(step(groups, { group: 0, story: 0 }, -1), { group: 0, story: 0 });
  });

  it('the upload type comes from the picker, with a safe default per kind', () => {
    assert.equal(uploadMimeType({ type: 'image', mimeType: 'image/png' }), 'image/png');
    assert.equal(uploadMimeType({ type: 'image' }), 'image/jpeg');
    assert.equal(uploadMimeType({ type: 'video', mimeType: 'video/quicktime' }), 'video/quicktime');
    assert.equal(uploadMimeType({ type: 'video' }), 'video/mp4');
  });
});

describe('videoProgress', () => {
  it('follows the player, not the wall clock, so buffering never cuts the end off', () => {
    assert.equal(videoProgress(0, 12), 0);
    assert.equal(videoProgress(6, 12), 0.5);
    assert.equal(videoProgress(13, 12), 1);
  });
  it('is 0 while the duration is not known yet', () => {
    assert.equal(videoProgress(3, 0), 0);
    assert.equal(videoProgress(3, Number.NaN), 0);
  });
});

describe('nextAuthor', () => {
  const groups = [{ stories: [1, 2] }, { stories: [1, 2, 3] }, { stories: [1] }];
  it('skips the rest of this person\'s stories', () => {
    assert.deepEqual(nextAuthor(groups, { group: 0, story: 0 }), { group: 1, story: 0 });
    assert.deepEqual(nextAuthor(groups, { group: 1, story: 1 }), { group: 2, story: 0 });
  });
  it('closes after the last person', () => {
    assert.equal(nextAuthor(groups, { group: 2, story: 0 }), 'close');
  });
});
