/**
 * Pure-logic tests for the two Casa Media helpers whose rules are easy to get
 * subtly wrong: the returnTo TTL/consume contract and cover-width selection.
 *
 * Run with:  node --test utils/__tests__/mediaHelpers.test.mts
 *
 * Deliberately `.mts` so it is outside tsconfig's `**\/*.ts` include — this repo
 * has no test runner or test tsconfig, and the file exists to be executed by
 * Node's built-in runner, not type-checked as app source. Both modules under
 * test import nothing from react-native, which is what makes this possible.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  RETURN_TO_TTL_MS,
  buildReturnTo,
  consumeReturnTo,
  isFresh,
  isSafeReturnHref,
  parseReturnTo,
} from '../returnTo.core.ts';
import { WIDTH_LADDER, appendWidth, isResizable, pickWidth } from '../mediaUrl.core.ts';

const NOW = 1_700_000_000_000;

describe('returnTo.core', () => {
  it('accepts only in-app absolute paths', () => {
    assert.equal(isSafeReturnHref('/media/item/abc'), true);
    assert.equal(isSafeReturnHref('https://evil.example/x'), false);
    assert.equal(isSafeReturnHref('//evil.example/x'), false);
    assert.equal(isSafeReturnHref('media/item/abc'), false);
    assert.equal(isSafeReturnHref(''), false);
    assert.equal(isSafeReturnHref(undefined), false);
  });

  it('stamps savedAt and keeps optional ids only when present', () => {
    const entry = buildReturnTo({ href: '/media/item/abc', mediaId: 'abc' }, NOW);
    assert.deepEqual(entry, { href: '/media/item/abc', mediaId: 'abc', savedAt: NOW });
    assert.deepEqual(buildReturnTo({ href: '/media/item/abc' }, NOW), {
      href: '/media/item/abc',
      savedAt: NOW,
    });
    assert.equal(buildReturnTo({ href: 'https://evil.example' }, NOW), null);
  });

  it('is fresh right up to the TTL and stale on it', () => {
    const entry = { href: '/x', savedAt: NOW };
    assert.equal(isFresh(entry, NOW), true);
    assert.equal(isFresh(entry, NOW + RETURN_TO_TTL_MS - 1), true);
    assert.equal(isFresh(entry, NOW + RETURN_TO_TTL_MS), false);
    assert.equal(isFresh(entry, NOW + RETURN_TO_TTL_MS * 2), false);
  });

  it('treats a backwards clock as fresh rather than dropping the intent', () => {
    assert.equal(isFresh({ href: '/x', savedAt: NOW }, NOW - 60_000), true);
  });

  it('rejects malformed stored payloads', () => {
    assert.equal(parseReturnTo(null), null);
    assert.equal(parseReturnTo('not json'), null);
    assert.equal(parseReturnTo('[]'), null);
    assert.equal(parseReturnTo('{"href":"/x"}'), null); // no savedAt
    assert.equal(parseReturnTo('{"savedAt":1}'), null); // no href
    assert.equal(parseReturnTo(`{"href":"https://evil.example","savedAt":${NOW}}`), null);
  });

  it('consumes a fresh entry and drops an expired one', () => {
    const raw = JSON.stringify({ href: '/media/item/abc', mediaId: 'abc', savedAt: NOW });
    assert.deepEqual(consumeReturnTo(raw, NOW + 1_000), {
      href: '/media/item/abc',
      mediaId: 'abc',
      savedAt: NOW,
    });
    assert.equal(consumeReturnTo(raw, NOW + RETURN_TO_TTL_MS + 1), null);
    assert.equal(consumeReturnTo(null, NOW), null);
  });
});

describe('mediaUrl.core', () => {
  it('picks the smallest rung that covers width x dpr', () => {
    assert.equal(pickWidth(160, 1), 320);
    assert.equal(pickWidth(160, 2), 320);
    assert.equal(pickWidth(320, 2), 640);
    assert.equal(pickWidth(390, 2), 1080);
    assert.equal(pickWidth(540, 2), 1080);
    assert.equal(pickWidth(800, 2), 1600);
  });

  it('caps the pixel ratio at 2 so 3x devices do not request more', () => {
    assert.equal(pickWidth(390, 3), pickWidth(390, 2));
    assert.equal(pickWidth(320, 4), 640);
  });

  it('clamps to the ladder ends for degenerate input', () => {
    assert.equal(pickWidth(0, 2), WIDTH_LADDER[0]);
    assert.equal(pickWidth(-10, 2), WIDTH_LADDER[0]);
    assert.equal(pickWidth(Number.NaN, 2), WIDTH_LADDER[0]);
    assert.equal(pickWidth(5000, 2), WIDTH_LADDER[WIDTH_LADDER.length - 1]);
    assert.equal(pickWidth(200, 0), 320); // bad dpr falls back to 1
  });

  it('only resizes plain http(s) still images', () => {
    assert.equal(isResizable('https://cdn.example/a.jpg'), true);
    assert.equal(isResizable('https://cdn.example/v/manifest.m3u8'), false);
    assert.equal(isResizable('data:image/png;base64,AAA'), false);
    assert.equal(isResizable(''), false);
  });

  it('appends w= without clobbering an existing query, hash or width', () => {
    assert.equal(appendWidth('https://cdn.example/a.jpg', 640), 'https://cdn.example/a.jpg?w=640');
    assert.equal(
      appendWidth('https://cdn.example/a.jpg?token=xyz', 640),
      'https://cdn.example/a.jpg?token=xyz&w=640',
    );
    assert.equal(
      appendWidth('https://cdn.example/a.jpg#frag', 640),
      'https://cdn.example/a.jpg?w=640#frag',
    );
    assert.equal(
      appendWidth('https://cdn.example/a.jpg?w=320', 640),
      'https://cdn.example/a.jpg?w=320',
    );
    assert.equal(appendWidth(null, 640), null);
    assert.equal(
      appendWidth('https://cdn.example/v/manifest.m3u8', 640),
      'https://cdn.example/v/manifest.m3u8',
    );
  });
});
