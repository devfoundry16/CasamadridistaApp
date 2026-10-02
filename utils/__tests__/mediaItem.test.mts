/**
 * The item screen's pure decisions: what to fetch, how tall the player is, what
 * text to show.
 *
 * Run with:  node --test utils/__tests__/mediaItem.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { itemTexts, needsPlayback, playerHeight } from '../mediaItem.core.ts';

describe('needsPlayback', () => {
  it('a video and a short update ask for fresh playback URLs', () => {
    assert.equal(needsPlayback({ type: 'video', locked: false }), true);
    assert.equal(needsPlayback({ type: 'update', locked: false }), true);
  });

  it('a photo, gallery or story does not', () => {
    for (const type of ['photo', 'gallery', 'story']) {
      assert.equal(needsPlayback({ type, locked: false }), false);
    }
  });

  it('a locked item never does, whatever its type', () => {
    assert.equal(needsPlayback({ type: 'video', locked: true }), false);
  });

  it('nothing loaded yet: no', () => {
    assert.equal(needsPlayback(undefined), false);
  });
});

describe('playerHeight', () => {
  const screen = { width: 390, height: 844 };

  it('a horizontal or long video gets a 16:9 frame', () => {
    assert.equal(playerHeight(screen, { type: 'video', video_format: 'horizontal' }), Math.round(390 * (9 / 16)));
    assert.equal(playerHeight(screen, { type: 'video', video_format: 'long' }), Math.round(390 * (9 / 16)));
  });

  it('a vertical short gets a tall frame, capped at 70% of the screen', () => {
    // 9:16 at full width would be 693pt; 70% of 844 is 591.
    assert.equal(playerHeight(screen, { type: 'video', video_format: 'vertical_short' }), Math.round(844 * 0.7));
    // A short, wide window is not capped: the 9:16 frame already fits.
    assert.equal(
      playerHeight({ width: 200, height: 844 }, { type: 'video', video_format: 'vertical_short' }),
      Math.round(200 * (16 / 9)),
    );
  });

  it('anything without a vertical format keeps the 16:9 cover', () => {
    assert.equal(playerHeight(screen, { type: 'photo', video_format: null }), Math.round(390 * (9 / 16)));
    assert.equal(playerHeight(screen, { type: 'video', video_format: null }), Math.round(390 * (9 / 16)));
  });
});

describe('itemTexts', () => {
  it('shows the description, then the caption when it says something else', () => {
    assert.deepEqual(itemTexts({ description: 'Short', caption: 'The longer caption' }), [
      'Short',
      'The longer caption',
    ]);
  });

  it('does not repeat a caption that is the description (Quick Post writes both)', () => {
    assert.deepEqual(itemTexts({ description: 'Same text', caption: ' Same text ' }), ['Same text']);
  });

  it('a caption alone is shown; nothing at all is nothing', () => {
    assert.deepEqual(itemTexts({ description: null, caption: 'Only a caption' }), ['Only a caption']);
    assert.deepEqual(itemTexts({ description: '', caption: null }), []);
  });
});
