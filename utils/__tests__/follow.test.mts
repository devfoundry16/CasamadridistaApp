/**
 * Following a person, on the app side: the optimistic profile change, and the
 * strings in both languages.
 *
 * Run with:  node --test utils/__tests__/follow.test.mts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { canFollow, withFollow } from '../follow.core.ts';

const profile = (following: boolean, followers: number, state = 'none') => ({
  user: { id: 'b' },
  stats: { posts: 1, friends: 2, followers, joined_year: 2024 },
  relationship: { state, can_message: true, following },
});

describe('withFollow', () => {
  it('following adds one follower; unfollowing takes one away; never below zero', () => {
    assert.deepEqual(withFollow(profile(false, 9), true).stats.followers, 10);
    assert.equal(withFollow(profile(false, 9), true).relationship.following, true);
    assert.equal(withFollow(profile(true, 10), false).stats.followers, 9);
    assert.equal(withFollow(profile(true, 0), false).stats.followers, 0);
  });
  it('the same state again changes nothing, and the rest of the profile is kept', () => {
    const p = profile(true, 10, 'friends');
    const out = withFollow(p, true);
    assert.equal(out.stats.followers, 10);
    assert.equal(out.relationship.state, 'friends');
    assert.equal(out.relationship.can_message, true);
  });
});

describe('canFollow', () => {
  it('anyone but yourself, and not someone you block or who blocked you', () => {
    assert.equal(canFollow('none'), true);
    assert.equal(canFollow('friends'), true);
    assert.equal(canFollow('request_sent'), true);
    assert.equal(canFollow('self'), false);
    assert.equal(canFollow('blocking'), false);
  });
});

describe('follow strings exist in both languages', () => {
  const load = (locale: string) =>
    JSON.parse(readFileSync(new URL(`../../i18n/locales/${locale}/translation.json`, import.meta.url), 'utf8'));
  for (const locale of ['en-US', 'ar-SA']) {
    it(locale, () => {
      const s = load(locale).social;
      for (const key of ['follow', 'following', 'followers', 'unfollow', 'followFailed']) {
        assert.equal(typeof s.profile[key], 'string', `${locale} social.profile.${key}`);
      }
      assert.equal(typeof s.notifications.follow, 'string', `${locale} social.notifications.follow`);
      assert.match(s.notifications.follow, /\{\{name\}\}/);
    });
  }
});
