import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/**
 * Home as the feed, the Fan Clubs tab, the feed's "..." menu and the video
 * player: every label they use exists in both languages.
 */
const KEYS = [
  'nav.fanClubsTab',
  'home.composerPrompt',
  'home.createStory',
  'home.createVideo',
  'home.createPhoto',
  'home.memberStrip',
  'home.memberStripCta',
  'fanClubsTab.browse',
  'fanClubsTab.feedTitle',
  'community.reportPost',
  'community.postMenu',
  'video.mute',
  'video.unmute',
  'video.close',
  'video.play',
  'video.pause',
  'video.openFullScreen',
];

describe('home feed labels exist in both languages', () => {
  for (const locale of ['en-US', 'ar-SA']) {
    it(locale, () => {
      const strings = JSON.parse(readFileSync(new URL(`../../i18n/locales/${locale}/translation.json`, import.meta.url), 'utf8'));
      for (const key of KEYS) {
        const value = key.split('.').reduce((node, part) => node?.[part], strings);
        assert.equal(typeof value, 'string', `${locale} ${key}`);
        assert.ok(value.trim().length > 0, `${locale} ${key} is empty`);
      }
    });
  }
});
