/**
 * Community post helpers: the carousel page under RTL, the location field,
 * the report form, and patching a post in the query cache.
 *
 * Run with:  node --test utils/__tests__/post.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  LOCATION_MAX,
  POST_REPORT_REASONS,
  carouselIndex,
  normaliseLocation,
  patchPost,
  patchPostInPages,
  reportErrorKey,
  reportReady,
  isAuthRefusal,
} from '../post.core.ts';
import { SOCIAL_REPORT_REASONS } from '../../types/social.ts';

describe('carouselIndex', () => {
  const W = 390;

  it('LTR: the offset over the page width', () => {
    assert.equal(carouselIndex(0, W, 3, false), 0);
    assert.equal(carouselIndex(W, W, 3, false), 1);
    assert.equal(carouselIndex(W * 2, W, 3, false), 2);
  });

  it('rounds a page that has not quite settled', () => {
    assert.equal(carouselIndex(W * 0.9, W, 3, false), 1);
    assert.equal(carouselIndex(W * 1.4, W, 3, false), 1);
  });

  it('RTL: the offset counts from the other end, so it is inverted', () => {
    assert.equal(carouselIndex(0, W, 3, true), 2);
    assert.equal(carouselIndex(W, W, 3, true), 1);
    assert.equal(carouselIndex(W * 2, W, 3, true), 0);
  });

  it('clamps overscroll and bounce into range', () => {
    assert.equal(carouselIndex(-50, W, 3, false), 0);
    assert.equal(carouselIndex(W * 5, W, 3, false), 2);
    assert.equal(carouselIndex(-50, W, 3, true), 2);
    assert.equal(carouselIndex(W * 5, W, 3, true), 0);
  });

  it('a zero width or an empty list is page 0, never NaN', () => {
    assert.equal(carouselIndex(100, 0, 3, false), 0);
    assert.equal(carouselIndex(100, W, 0, true), 0);
    assert.equal(carouselIndex(Number.NaN, W, 3, false), 0);
  });
});

describe('normaliseLocation', () => {
  it('trims and collapses whitespace', () => {
    assert.equal(normaliseLocation('  Santiago   Bernabéu \n Madrid '), 'Santiago Bernabéu Madrid');
  });

  it('empty is null, so nothing is sent', () => {
    assert.equal(normaliseLocation(''), null);
    assert.equal(normaliseLocation('   '), null);
    assert.equal(normaliseLocation(null), null);
    assert.equal(normaliseLocation(undefined), null);
  });

  it(`caps at ${LOCATION_MAX} characters`, () => {
    assert.equal(normaliseLocation('a'.repeat(100))!.length, LOCATION_MAX);
    assert.equal(normaliseLocation('ملعب سانتياغو برنابيو'), 'ملعب سانتياغو برنابيو');
  });

  it('never cuts an emoji in half', () => {
    const text = 'a'.repeat(LOCATION_MAX - 1) + '🏟️';
    const out = normaliseLocation(text)!;
    assert.ok(out.length <= LOCATION_MAX);
    assert.equal(out, 'a'.repeat(LOCATION_MAX - 1));
  });
});

describe('report form', () => {
  it('the reasons are the eight social reasons', () => {
    assert.deepEqual([...POST_REPORT_REASONS], [...SOCIAL_REPORT_REASONS]);
  });

  it('needs a reason', () => {
    assert.equal(reportReady(null, ''), false);
    assert.equal(reportReady('spam', ''), true);
  });

  it('"other" needs a description', () => {
    assert.equal(reportReady('other', ''), false);
    assert.equal(reportReady('other', '   '), false);
    assert.equal(reportReady('other', 'He keeps posting my photos'), true);
  });

  it('maps the server refusals to friendly strings, and nothing else', () => {
    assert.equal(reportErrorKey('invalid_reason'), 'community.reportErrors.invalid_reason');
    assert.equal(reportErrorKey('details_required'), 'community.reportErrors.details_required');
    assert.equal(reportErrorKey('already_reported'), 'community.reportErrors.already_reported');
    assert.equal(reportErrorKey('boom'), null);
    assert.equal(reportErrorKey(undefined), null);
  });
});

describe('patching a cached post', () => {
  const a = { id: 'a', saved_by_me: false, save_count: 0 };
  const b = { id: 'b', saved_by_me: false, save_count: 3 };
  const c = { id: 'c', saved_by_me: true, save_count: 1 };
  const feed = { pages: [{ posts: [a, b], nextCursor: 'x' }, { posts: [c], nextCursor: null }], pageParams: [null, 'x'] };

  it('patchPost merges into the matching post only', () => {
    assert.deepEqual(patchPost(b, 'b', { saved_by_me: true, save_count: 4 }), { id: 'b', saved_by_me: true, save_count: 4 });
    assert.equal(patchPost(b, 'a', { saved_by_me: true }), b);
    assert.equal(patchPost(undefined, 'a', { saved_by_me: true }), undefined);
  });

  it('patchPostInPages patches the post on whichever page holds it', () => {
    const out = patchPostInPages(feed, 'c', { saved_by_me: false, save_count: 0 })!;
    assert.deepEqual(out.pages[1].posts[0], { id: 'c', saved_by_me: false, save_count: 0 });
    assert.equal(out.pages[1].nextCursor, null);
    assert.deepEqual(out.pageParams, [null, 'x']);
    // The input is left alone.
    assert.equal(c.saved_by_me, true);
  });

  it('keeps untouched pages and posts by reference', () => {
    const out = patchPostInPages(feed, 'c', { save_count: 2 })!;
    assert.equal(out.pages[0], feed.pages[0]);
    assert.notEqual(out.pages[1], feed.pages[1]);
  });

  it('returns the same object when the post is not there, so nothing re-renders', () => {
    assert.equal(patchPostInPages(feed, 'zzz', { save_count: 2 }), feed);
    assert.equal(patchPostInPages(undefined, 'a', { save_count: 2 }), undefined);
  });

  it('tolerates a malformed cache entry', () => {
    const odd = { pages: [{ posts: null }, {}] } as any;
    assert.equal(patchPostInPages(odd, 'a', { save_count: 2 }), odd);
  });
});

describe('isAuthRefusal', () => {
  it('is true only for a 401, so the raw "No token provided" never reaches a guest', () => {
    assert.equal(isAuthRefusal(401), true);
    for (const status of [400, 403, 409, 500, undefined, null]) assert.equal(isAuthRefusal(status), false);
  });
});

describe('return paths for the community sign-in gate', () => {
  it('accepts the post, media-comments and compose hrefs', async () => {
    const { isSafeReturnHref } = await import('../returnTo.core.ts');
    for (const href of [
      '/community/post/0a1b2c3d-4e5f-6789-abcd-ef0123456789',
      '/media/comments/0a1b2c3d-4e5f-6789-abcd-ef0123456789',
      '/community/compose',
      '/community/report/0a1b2c3d-4e5f-6789-abcd-ef0123456789',
    ]) {
      assert.equal(isSafeReturnHref(href), true, href);
    }
  });
});
