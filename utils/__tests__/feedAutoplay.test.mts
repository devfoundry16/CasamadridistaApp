import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { feedTabOf, pickActiveVideo, videoPostsOf, playableUri, viewerIndex, viewerSourceOf, seekMore, VIEWER_SEEK_PAGES } from '../feedAutoplay.core.ts';

/**
 * Only one video plays in the feed at a time (one player per screen): the
 * first ready video post the list reports as viewable. Everything else shows
 * its poster.
 */
const video = (id: string, over: object = {}) => ({
  id,
  kind: 'video',
  media: [{ kind: 'video', status: 'ready', hls_url: `https://v/${id}.m3u8`, public_url: null, ...over }],
});
const photo = (id: string) => ({ id, kind: 'image', media: [{ kind: 'image', status: 'ready', hls_url: null, public_url: 'p.jpg' }] });
const seen = (...posts: object[]) => posts.map((item) => ({ item, isViewable: true }));

describe('pickActiveVideo', () => {
  it('plays the first viewable video post, in list order', () => {
    assert.equal(pickActiveVideo(seen(photo('a'), video('b'), video('c'))), 'b');
  });

  it('skips a video that is still processing, failed, or has nothing to play', () => {
    assert.equal(pickActiveVideo(seen(video('a', { status: 'processing' }), video('b'))), 'b');
    assert.equal(pickActiveVideo(seen(video('a', { status: 'failed' }))), null);
    assert.equal(pickActiveVideo(seen(video('a', { hls_url: null, public_url: null }))), null);
  });

  it('ignores items the list no longer counts as viewable', () => {
    assert.equal(pickActiveVideo([{ item: video('a'), isViewable: false }, ...seen(video('b'))]), 'b');
  });

  it('nothing to play is null', () => {
    assert.equal(pickActiveVideo(seen(photo('a'))), null);
    assert.equal(pickActiveVideo([]), null);
  });
});

describe('playableUri', () => {
  it('prefers the stream, falls back to the file', () => {
    assert.equal(playableUri({ hls_url: 'h.m3u8', public_url: 'f.mp4' }), 'h.m3u8');
    assert.equal(playableUri({ hls_url: null, public_url: 'f.mp4' }), 'f.mp4');
    assert.equal(playableUri({ hls_url: null, public_url: null }), null);
  });
});

describe('videoPostsOf', () => {
  it('lists the ready video posts across every loaded page, once each', () => {
    const pages = [{ posts: [video('a'), photo('b')] }, { posts: [video('c'), video('a'), video('d', { status: 'processing' })] }];
    assert.deepEqual(videoPostsOf(pages).map((p) => p.id), ['a', 'c']);
  });

  it('no pages is no videos', () => {
    assert.deepEqual(videoPostsOf(undefined), []);
  });
});

describe('feedTabOf', () => {
  // The viewer's `feed` link param names the feed whose videos it pages
  // through; anything else opens the one post.
  it('accepts the four feed tabs', () => {
    for (const tab of ['for-you', 'trending', 'recent', 'fan-clubs', 'reels']) assert.equal(feedTabOf(tab), tab);
  });
  it('anything else is no feed', () => {
    assert.equal(feedTabOf('hashtag'), null);
    assert.equal(feedTabOf(undefined), null);
    assert.equal(feedTabOf(['for-you']), 'for-you');
  });
});

describe('viewerIndex', () => {
  // The viewer remembers the open video by id: a feed refresh may reorder
  // the list or drop the post, and a position would then point elsewhere.
  const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  it('finds the open video wherever it now is', () => {
    assert.equal(viewerIndex(list, 'b'), 1);
    assert.equal(viewerIndex([{ id: 'b' }, { id: 'a' }], 'b'), 0);
  });
  it('a video no longer in the list falls back to the first, never past the end', () => {
    assert.equal(viewerIndex(list, 'gone'), 0);
    assert.equal(viewerIndex([], 'a'), -1);
  });
});

describe('viewerSourceOf', () => {
  // What the viewer pages through: a feed tab, one person's reels, or nothing
  // (the one post). Every key starts with 'feed', so a like or save patched
  // into ['feed'] reaches the viewer's copy too.
  const USER = '00000000-0000-4000-8000-00000000000b';

  it('a feed tab pages through that feed, without looking further for the post', () => {
    assert.deepEqual(viewerSourceOf({ feed: 'reels' }), { kind: 'feed', tab: 'reels', key: ['feed', 'reels'], seekPages: 1 });
  });

  it('a profile pages through that person\'s reels, looking a few pages ahead for the tapped one', () => {
    assert.deepEqual(viewerSourceOf({ profile: USER }), {
      kind: 'profile',
      userId: USER,
      key: ['feed', 'profile', USER, 'reels'],
      seekPages: VIEWER_SEEK_PAGES,
    });
    assert.equal(VIEWER_SEEK_PAGES, 6, 'the first page and five more');
    assert.deepEqual(viewerSourceOf({ profile: [USER] })?.key, ['feed', 'profile', USER, 'reels']);
  });

  it('anything else is the one post', () => {
    assert.equal(viewerSourceOf({}), null);
    assert.equal(viewerSourceOf({ feed: 'hashtag' }), null);
    assert.equal(viewerSourceOf({ profile: 'not-a-uuid' }), null);
    assert.equal(viewerSourceOf({ profile: '../x' }), null);
  });
});

describe('seekMore', () => {
  // The tapped reel may sit further down a profile than the first page.
  it('loads another page while the post is not found, there is one, and the limit is not reached', () => {
    assert.equal(seekMore({ found: false, pages: 1, hasNext: true }, 6), true);
    assert.equal(seekMore({ found: false, pages: 5, hasNext: true }, 6), true);
  });
  it('stops once found, at the end, or at the limit', () => {
    assert.equal(seekMore({ found: true, pages: 1, hasNext: true }, 6), false);
    assert.equal(seekMore({ found: false, pages: 2, hasNext: false }, 6), false);
    assert.equal(seekMore({ found: false, pages: 6, hasNext: true }, 6), false);
    assert.equal(seekMore({ found: false, pages: 1, hasNext: true }, 1), false, 'a feed never looks further');
  });
});
