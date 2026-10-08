import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { CREATE_CHOICES, composeStart, createHref, yourStoryBubble } from '../createChooser.core.ts';

/**
 * Create from a profile (spec §3): Photo, Video or Story. And "Your story" in
 * Community, which used to lose its + once a story was live, leaving a
 * long-press as the only way to add another.
 */
describe('Create', () => {
  it('offers Photo, Video and Story, in that order', () => {
    assert.deepEqual(CREATE_CHOICES, ['photo', 'video', 'story']);
  });

  it('Photo and Video open the composer on that picker; Story opens the story camera', () => {
    assert.equal(createHref('photo'), '/community/compose?start=photo');
    assert.equal(createHref('video'), '/community/compose?start=video');
    assert.equal(createHref('story'), '/stories/create');
  });

  it('the composer reads the start back, ignoring anything else', () => {
    assert.equal(composeStart('photo'), 'images');
    assert.equal(composeStart('video'), 'videos');
    assert.equal(composeStart(['video']), 'videos');
    assert.equal(composeStart('story'), null);
    assert.equal(composeStart(undefined), null);
  });
});

describe('yourStoryBubble', () => {
  it('without a live story: the bubble and its + both add one', () => {
    assert.deepEqual(yourStoryBubble({ viewerId: 'u1', hasLive: false }), {
      open: '/stories/create',
      add: '/stories/create',
      labelKey: 'stories.add',
    });
  });

  it('with a live story: the bubble plays it, and the + still adds another', () => {
    assert.deepEqual(yourStoryBubble({ viewerId: 'u1', hasLive: true }), {
      open: '/stories/u1?from=row',
      add: '/stories/create',
      labelKey: 'stories.yourStory',
    });
  });
});
