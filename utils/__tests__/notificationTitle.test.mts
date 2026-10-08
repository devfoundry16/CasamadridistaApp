import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { SOCIAL_TITLE_TYPES, socialTitleKey } from '../notificationTitle.core.ts';

/**
 * Which translated title a social inbox row shows. The stored title is English
 * for clients that render it verbatim; the app rebuilds it from the payload in
 * the reader's language.
 */
describe('socialTitleKey', () => {
  it('titles a story mention in the reader\'s language', () => {
    assert.equal(socialTitleKey({ type: 'story_mention', actor_name: 'Ali' }), 'social.notifications.story_mention');
  });

  it('tells a comment mention and a reply apart from the plain types', () => {
    assert.equal(socialTitleKey({ type: 'mention', actor_name: 'Ali' }), 'social.notifications.mention');
    assert.equal(socialTitleKey({ type: 'mention', actor_name: 'Ali', comment_id: 'c1' }), 'social.notifications.mention_comment');
    assert.equal(socialTitleKey({ type: 'post_comment', actor_name: 'Ali', reply: true }), 'social.notifications.post_comment_reply');
    assert.equal(socialTitleKey({ type: 'friend_request', actor_name: 'Ali' }), 'social.notifications.friend_request');
  });

  it('falls back to the stored title without an actor, or for a type it does not localise', () => {
    assert.equal(socialTitleKey({ type: 'story_mention' }), null);
    assert.equal(socialTitleKey({ type: 'media_item', actor_name: 'Ali' }), null);
    assert.equal(socialTitleKey(undefined), null);
  });
});

describe('the social titles exist in both languages', () => {
  const load = (locale: string) =>
    JSON.parse(readFileSync(new URL(`../../i18n/locales/${locale}/translation.json`, import.meta.url), 'utf8'));
  for (const locale of ['en-US', 'ar-SA']) {
    it(locale, () => {
      const strings = load(locale).social.notifications;
      for (const key of [...SOCIAL_TITLE_TYPES, 'mention_comment', 'post_comment_reply']) {
        assert.equal(typeof strings[key], 'string', `${locale} social.notifications.${key}`);
        assert.match(strings[key], /\{\{name\}\}/, `${locale} ${key} names the actor`);
      }
    });
  }
});
