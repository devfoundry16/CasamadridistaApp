/**
 * Carrying a shared Casa Media link across a fresh install: the destination a
 * new install should open, read from the Play install referrer (Android) or
 * from a link the landing page copied (iOS).
 *
 * Run with:  node --test utils/__tests__/deferredLink.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  FRESH_INSTALL_MS,
  LINK_HOSTS,
  REFERRER_KEY,
  buildReferrer,
  isFreshInstall,
  pathFromLink,
  pathFromReferrer,
} from '../deferredLink.core.ts';

const ID = '11111111-1111-4111-8111-111111111111';

describe('pathFromReferrer', () => {
  it('reads the destination the Play link carried', () => {
    assert.equal(pathFromReferrer(`${REFERRER_KEY}=%2Fmedia%2Fitem%2F${ID}`), `/media/item/${ID}`);
    assert.equal(
      pathFromReferrer(`utm_source=share&${REFERRER_KEY}=%2Fmatch%2F1035041%2Fmedia&utm_medium=x`),
      '/match/1035041/media',
    );
  });

  it('round-trips with buildReferrer', () => {
    assert.equal(pathFromReferrer(buildReferrer(`/media/item/${ID}`)), `/media/item/${ID}`);
  });

  it('ignores an organic install and anything that is not ours', () => {
    assert.equal(pathFromReferrer('utm_source=google-play&utm_medium=organic'), null);
    assert.equal(pathFromReferrer(''), null);
    assert.equal(pathFromReferrer(null), null);
  });

  it('refuses a destination outside the routes a shared link can name', () => {
    // The referrer is attacker-controlled text: only a Casa Media item or a
    // match's media page may be opened from it.
    assert.equal(pathFromReferrer(`${REFERRER_KEY}=%2Faccount%2Fdelete`), null);
    assert.equal(pathFromReferrer(`${REFERRER_KEY}=https%3A%2F%2Fevil.example%2F`), null);
    assert.equal(pathFromReferrer(`${REFERRER_KEY}=%2F%2Fevil.example`), null);
    assert.equal(pathFromReferrer(`${REFERRER_KEY}=%2Fmedia%2Fitem%2Fnot-a-uuid`), null);
    assert.equal(pathFromReferrer(`${REFERRER_KEY}=%2Fmatch%2Fabc%2Fmedia`), null);
    assert.equal(pathFromReferrer(`${REFERRER_KEY}=%E0%A4%A`), null, 'broken encoding');
  });
});

describe('pathFromLink', () => {
  it('maps a shared item link to the item screen', () => {
    assert.equal(pathFromLink(`https://dashboard.casamadridista.com/m/${ID}`), `/media/item/${ID}`);
    assert.equal(pathFromLink(`https://dashboard.casamadridista.com/m/${ID}?c=camp`), `/media/item/${ID}`);
  });

  it('maps a match link to the match media page', () => {
    assert.equal(pathFromLink('https://dashboard.casamadridista.com/match/1035041/media'), '/match/1035041/media');
  });

  it('ignores a link to any other host, scheme or path', () => {
    assert.deepEqual([...LINK_HOSTS], ['dashboard.casamadridista.com']);
    assert.equal(pathFromLink(`https://evil.example/m/${ID}`), null);
    assert.equal(pathFromLink(`http://dashboard.casamadridista.com/m/${ID}`), null);
    // The same host serves the admin dashboard: none of its pages is an app link.
    assert.equal(pathFromLink('https://dashboard.casamadridista.com/login'), null);
    assert.equal(pathFromLink('https://dashboard.casamadridista.com/users'), null);
    // The domain the app claimed before, which was never live.
    assert.equal(pathFromLink(`https://casamadridista.app/m/${ID}`), null);
    assert.equal(pathFromLink('just some copied text'), null);
    assert.equal(pathFromLink(null), null);
  });
});

describe('isFreshInstall', () => {
  const NOW = 1_800_000_000_000;

  it('an install from the last week is fresh', () => {
    assert.equal(isFreshInstall(NOW - 60_000, NOW), true);
    assert.equal(isFreshInstall(NOW - FRESH_INSTALL_MS + 1, NOW), true);
  });

  it('an app installed long ago is not: an update must not go looking for a link', () => {
    assert.equal(isFreshInstall(NOW - FRESH_INSTALL_MS, NOW), false);
    assert.equal(isFreshInstall(NOW - 90 * 24 * 3600 * 1000, NOW), false);
  });

  it('an install time it cannot read is not fresh', () => {
    assert.equal(isFreshInstall(Number.NaN, NOW), false);
    assert.equal(isFreshInstall(null, NOW), false);
    // A clock that puts the install in the future is a broken reading.
    assert.equal(isFreshInstall(NOW + 60_000, NOW), false);
  });
});

describe('the link domain is one value everywhere', () => {
  it('app.json claims exactly the hosts the app reads links from, on /m/, /match/ and /p/ only', async () => {
    const fs = await import('node:fs');
    const app = JSON.parse(fs.readFileSync(new URL('../../app.json', import.meta.url), 'utf8')).expo;
    assert.deepEqual(app.ios.associatedDomains, LINK_HOSTS.map((h) => `applinks:${h}`));
    const data = app.android.intentFilters[0].data;
    assert.deepEqual([...new Set(data.map((d: { host: string }) => d.host))], [...LINK_HOSTS]);
    // With the trailing slash: a bare "/m" or "/p" prefix would also claim
    // dashboard pages such as /media, /moderation, /payouts and /permissions.
    assert.deepEqual([...new Set(data.map((d: { pathPrefix: string }) => d.pathPrefix))].sort(), ['/m/', '/match/', '/p/']);
    assert.equal(app.android.intentFilters[0].autoVerify, true);
  });
  it('share links are built on that host', async () => {
    const fs = await import('node:fs');
    const src = fs.readFileSync(new URL('../../constants/media.ts', import.meta.url), 'utf8');
    assert.match(src, new RegExp(`EXPO_PUBLIC_MEDIA_LINK_DOMAIN \\?\\? '${LINK_HOSTS[0].replace(/\./g, '\\.')}'`));
  });
});

describe('shared community posts', () => {
  const POST = 'a0000000-0000-4000-8000-000000000001';
  it('a /p/<id> link opens the post', () => {
    assert.equal(pathFromLink(`https://dashboard.casamadridista.com/p/${POST}`), `/community/post/${POST}`);
    assert.equal(pathFromLink(`https://dashboard.casamadridista.com/p/${POST}/`), `/community/post/${POST}`);
  });
  it('the Play referrer may carry the post path', () => {
    assert.equal(pathFromReferrer(buildReferrer(`/community/post/${POST}`)), `/community/post/${POST}`);
  });
  it('anything but a uuid is refused, and so are other community paths', () => {
    assert.equal(pathFromLink('https://dashboard.casamadridista.com/p/not-a-uuid'), null);
    assert.equal(pathFromReferrer(buildReferrer('/community/compose')), null);
    assert.equal(pathFromReferrer(buildReferrer(`/community/post/${POST}/edit`)), null);
  });
});
