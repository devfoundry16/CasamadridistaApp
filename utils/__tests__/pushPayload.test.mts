/**
 * Pure-logic tests for the push-payload router.
 *
 * This is the one place a hostile or malformed notification could steer
 * navigation, so the "never trust data.url" rule is worth pinning down.
 *
 * Run with:  node --test utils/__tests__/pushPayload.test.mts
 * `.mts` for the same reason as mediaHelpers.test.mts — see the header there.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  hrefFromPayloadWithScheme,
  parsePushPayload,
  safePathFromUrl,
} from '../pushPayload.core.ts';

const SCHEME = 'casamadridistaapp';
const href = (payload: any) => hrefFromPayloadWithScheme(payload, SCHEME);

describe('pushPayload.core — hrefFromPayload', () => {
  it('routes a media item, and carries the campaign through', () => {
    assert.equal(href({ v: 1, type: 'media_item', item_id: 'abc' }), '/media/item/abc');
    assert.equal(
      href({ v: 1, type: 'media_item', item_id: 'abc', campaign_id: 'c1' }),
      '/media/item/abc?c=c1',
    );
  });

  it('percent-encodes ids so a crafted id cannot inject a path or query', () => {
    assert.equal(
      href({ v: 1, type: 'media_item', item_id: '../../admin' }),
      '/media/item/..%2F..%2Fadmin',
    );
    assert.equal(
      href({ v: 1, type: 'media_item', item_id: 'a', campaign_id: 'x&y=1' }),
      '/media/item/a?c=x%26y%3D1',
    );
  });

  it('routes a match to its media tab', () => {
    assert.equal(href({ v: 1, type: 'media_match', match_id: 12345 }), '/match/12345/media');
    assert.equal(href({ v: 1, type: 'media_match' }), null); // no id ⇒ nowhere
  });

  it('routes a digest to the hub', () => {
    assert.equal(href({ v: 1, type: 'media_digest' }), '/media');
  });

  it('ignores data.url for every known type, even when it disagrees', () => {
    // The whole point: a typed payload is rebuilt from its ids, so a url that
    // says something else is inert.
    assert.equal(
      href({
        v: 1,
        type: 'media_item',
        item_id: 'abc',
        url: 'casamadridistaapp://account/wallet',
      }),
      '/media/item/abc',
    );
  });

  it('falls back to the url only for custom, and only for our own scheme', () => {
    assert.equal(
      href({ v: 1, type: 'custom', url: 'casamadridistaapp://media/archive' }),
      '/media/archive',
    );
    assert.equal(href({ v: 1, type: 'custom', url: 'https://evil.example/x' }), null);
    assert.equal(href({ v: 1, type: 'custom', url: 'javascript:alert(1)' }), null);
    assert.equal(href({ v: 1, type: 'custom' }), null);
  });

  it('returns null for a missing payload', () => {
    assert.equal(href(null), null);
    assert.equal(href(undefined), null);
  });
});

describe('pushPayload.core — safePathFromUrl', () => {
  it('accepts only our scheme and strips it to a leading-slash path', () => {
    assert.equal(safePathFromUrl('casamadridistaapp://media/now', SCHEME), '/media/now');
    assert.equal(safePathFromUrl('https://casamadridista.app/m/1', SCHEME), null);
    assert.equal(safePathFromUrl('otherapp://media/now', SCHEME), null);
    assert.equal(safePathFromUrl(undefined, SCHEME), null);
  });

  it('rejects a protocol-relative remainder that expo-router would treat as external', () => {
    assert.equal(safePathFromUrl('casamadridistaapp:///evil.example', SCHEME), null);
    assert.equal(safePathFromUrl('casamadridistaapp://', SCHEME), null);
  });
});

describe('pushPayload.core — parsePushPayload', () => {
  it('coerces a well-formed bag', () => {
    assert.deepEqual(
      parsePushPayload({ v: 1, type: 'media_item', item_id: 'a', match_id: 7, url: 'u' }),
      {
        v: 1,
        type: 'media_item',
        item_id: 'a',
        match_id: 7,
        campaign_id: undefined,
        url: 'u',
        web_url: undefined,
      },
    );
  });

  it('defaults v and drops wrongly-typed fields rather than passing them on', () => {
    const parsed = parsePushPayload({ type: 'media_match', match_id: '12345', item_id: 9 });
    assert.equal(parsed?.v, 1);
    assert.equal(parsed?.match_id, undefined); // a string id is not a match id
    assert.equal(parsed?.item_id, undefined);
    // …and so the router refuses to navigate on it.
    assert.equal(href(parsed), null);
  });

  it('rejects anything without a string type', () => {
    assert.equal(parsePushPayload(null), null);
    assert.equal(parsePushPayload('media_item'), null);
    assert.equal(parsePushPayload({ item_id: 'a' }), null);
    assert.equal(parsePushPayload({ type: 3 }), null);
  });
});
