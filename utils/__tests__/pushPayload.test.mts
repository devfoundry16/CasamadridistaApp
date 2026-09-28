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
    assert.equal(
      href({ v: 1, type: 'media_item', item_id: 'abc' }),
      '/media/item/abc?surface=push',
    );
    assert.equal(
      href({ v: 1, type: 'media_item', item_id: 'abc', campaign_id: 'c1' }),
      '/media/item/abc?c=c1&surface=push',
    );
  });

  it('stamps the surface so a view that followed a push is attributable', () => {
    // Without it the `item_view` lands with surface NULL and a push tap is
    // indistinguishable from any other route in. The deeplink route (`/m/[id]`)
    // has always done this; this branch was the asymmetry.
    for (const payload of [
      { v: 1, type: 'media_item', item_id: 'abc' },
      { v: 1, type: 'media_item', item_id: 'abc', campaign_id: 'c1' },
    ]) {
      assert.match(href(payload)!, /[?&]surface=push$/);
    }
    // The campaign stays first, so existing links read the same up to the `&`.
    assert.ok(
      href({ v: 1, type: 'media_item', item_id: 'abc', campaign_id: 'c1' })!.startsWith(
        '/media/item/abc?c=c1',
      ),
    );
  });

  it('percent-encodes ids so a crafted id cannot inject a path or query', () => {
    assert.equal(
      href({ v: 1, type: 'media_item', item_id: '../../admin' }),
      '/media/item/..%2F..%2Fadmin?surface=push',
    );
    assert.equal(
      href({ v: 1, type: 'media_item', item_id: 'a', campaign_id: 'x&y=1' }),
      '/media/item/a?c=x%26y%3D1&surface=push',
    );
  });

  it('leaves a match push to the screen that owns its own surface', () => {
    // MatchMediaScreen wraps itself in a `match` surface provider; stamping
    // `push` on the href would take that identity away from the screen.
    assert.equal(href({ v: 1, type: 'media_match', match_id: 7 }), '/match/7/media');
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
      '/media/item/abc?surface=push',
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

describe('pushPayload.core — social payloads', () => {
  const CONV = 'c0000000-0000-4000-8000-000000000001';
  const USER = '00000000-0000-4000-8000-00000000000b';

  it('a DM push opens its conversation; a friend push opens the profile', () => {
    assert.equal(href({ v: 1, type: 'dm', conversation_id: CONV }), `/social/chat/${CONV}`);
    assert.equal(href({ v: 1, type: 'friend_request', user_id: USER }), `/user/${USER}`);
    assert.equal(href({ v: 1, type: 'friend_accept', user_id: USER }), `/user/${USER}`);
  });

  it('a malformed social id lands on the list screen, never on a crafted path', () => {
    assert.equal(href({ v: 1, type: 'dm', conversation_id: '../admin' }), '/social/messages');
    assert.equal(href({ v: 1, type: 'dm' }), '/social/messages');
    assert.equal(href({ v: 1, type: 'friend_request', user_id: 'x?y=1' }), '/social/friends');
  });

  it('ignores data.url for a social type, whatever it says', () => {
    assert.equal(href({ v: 1, type: 'dm', conversation_id: CONV, url: 'casamadridistaapp://admin' }), `/social/chat/${CONV}`);
  });

  it('parses the social fields and drops wrongly-typed ones', () => {
    const parsed = parsePushPayload({ type: 'dm', conversation_id: CONV, user_id: 7, actor_name: 'Ali' });
    assert.equal(parsed?.conversation_id, CONV);
    assert.equal(parsed?.user_id, undefined);
    assert.equal(parsed?.actor_name, 'Ali');
  });
});

describe('pushPayload.core — post activity payloads', () => {
  const POST = 'a0000000-0000-4000-8000-000000000001';
  const COMMENT = 'c0000000-0000-4000-8000-000000000002';
  const USER = '00000000-0000-4000-8000-00000000000b';

  it('a like, comment, mention or tag opens the post', () => {
    for (const type of ['post_like', 'post_comment', 'mention', 'tag']) {
      assert.equal(href({ v: 1, type, post_id: POST, user_id: USER }), `/community/post/${POST}`, type);
    }
  });

  it('a mention in a comment still opens the post', () => {
    assert.equal(href({ v: 1, type: 'mention', post_id: POST, comment_id: COMMENT }), `/community/post/${POST}`);
  });

  it('a malformed or missing post id goes nowhere, whatever data.url says', () => {
    assert.equal(href({ v: 1, type: 'post_like', post_id: '../admin' }), null);
    assert.equal(href({ v: 1, type: 'tag' }), null);
    assert.equal(href({ v: 1, type: 'mention', url: 'casamadridistaapp://account/wallet' }), null);
    assert.equal(
      href({ v: 1, type: 'post_comment', post_id: POST, url: 'casamadridistaapp://account/wallet' }),
      `/community/post/${POST}`,
    );
  });

  it('parses post_id and comment_id, and only as strings', () => {
    const parsed = parsePushPayload({ type: 'post_comment', post_id: POST, comment_id: COMMENT, user_id: USER, actor_name: 'Ali' });
    assert.equal(parsed?.type, 'post_comment');
    assert.equal(parsed?.post_id, POST);
    assert.equal(parsed?.comment_id, COMMENT);
    assert.equal(parsed?.user_id, USER);
    assert.equal(parsed?.actor_name, 'Ali');

    const bad = parsePushPayload({ type: 'post_like', post_id: 5, comment_id: {} });
    assert.equal(bad?.post_id, undefined);
    assert.equal(bad?.comment_id, undefined);
    assert.ok(!('post_id' in bad!));
  });

  it('keeps reply only when it is exactly true', () => {
    assert.equal(parsePushPayload({ type: 'post_comment', post_id: POST, reply: true })?.reply, true);
    for (const reply of ['true', 1, false, undefined]) {
      assert.ok(!('reply' in parsePushPayload({ type: 'post_comment', post_id: POST, reply })!), String(reply));
    }
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
