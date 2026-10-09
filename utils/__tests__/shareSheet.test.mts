import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { collectPages, saveableFiles, shareSheetRows } from '../shareSheet.core.ts';

/**
 * The post share sheet (spec 2.1.0 §04): sharing destinations for everyone,
 * owner tools only on your own post. Never Save or Delete on someone else's.
 */
describe('shareSheetRows', () => {
  it("someone else's post: send to friends and the three outside ways, nothing of the owner's", () => {
    assert.deepEqual(shareSheetRows({ isOwn: false, saveable: true }), ['friends', 'copy_link', 'share', 'qr']);
  });
  it('your own photo or video post adds Save to Photos and Delete', () => {
    assert.deepEqual(shareSheetRows({ isOwn: true, saveable: true }), ['friends', 'copy_link', 'share', 'qr', 'save', 'delete']);
  });
  it('your own text post has nothing to save', () => {
    assert.deepEqual(shareSheetRows({ isOwn: true, saveable: false }), ['friends', 'copy_link', 'share', 'qr', 'delete']);
  });
});

describe('saveableFiles', () => {
  const m = (over: object) => ({ id: 'x', kind: 'image', status: 'ready', public_url: null, hls_url: null, position: 0, ...over });
  it('every ready photo, in carousel order', () => {
    const files = saveableFiles([
      m({ id: 'b', position: 1, public_url: 'https://i/b.jpg' }),
      m({ id: 'a', position: 0, public_url: 'https://i/a.jpg' }),
      m({ id: 'c', position: 2, status: 'processing', public_url: 'https://i/c.jpg' }),
    ]);
    assert.deepEqual(files, [{ id: 'a', url: 'https://i/a.jpg' }, { id: 'b', url: 'https://i/b.jpg' }]);
  });
  it('a video file can be saved, a stream cannot', () => {
    assert.deepEqual(saveableFiles([m({ id: 'v', kind: 'video', public_url: 'https://s/v.mp4' })]), [{ id: 'v', url: 'https://s/v.mp4' }]);
    assert.deepEqual(saveableFiles([m({ id: 'v', kind: 'video', hls_url: 'https://s/v.m3u8', public_url: null })]), []);
    assert.deepEqual(saveableFiles([m({ id: 'v', kind: 'video', public_url: 'https://s/v.m3u8?x=1' })]), []);
  });
  it('no media, nothing to save', () => {
    assert.deepEqual(saveableFiles(undefined), []);
  });
});

describe('collectPages', () => {
  it('follows the cursor until the last page', async () => {
    const pages: Record<string, { items: number[]; next: string | null }> = {
      start: { items: [1, 2], next: 'b' },
      b: { items: [3], next: 'c' },
      c: { items: [4], next: null },
    };
    const seen: (string | null)[] = [];
    const all = await collectPages(async (cursor) => {
      seen.push(cursor);
      return pages[cursor ?? 'start'];
    }, 100);
    assert.deepEqual(all, [1, 2, 3, 4]);
    assert.deepEqual(seen, [null, 'b', 'c']);
  });
  it('stops at the cap, even mid-way through a page', async () => {
    const all = await collectPages(async () => ({ items: [1, 2, 3], next: 'more' }), 7);
    assert.deepEqual(all, [1, 2, 3, 1, 2, 3, 1]);
  });
});

describe('share sheet labels exist in both languages', () => {
  const KEYS = ['copyLink', 'linkCopied', 'shareVia', 'qrCode', 'qrTitle', 'qrHint', 'saveToPhotos', 'saved', 'deletePost', 'deleteConfirmTitle', 'deleteConfirmBody', 'deleted', 'more', 'sendTo'];
  for (const locale of ['en-US', 'ar-SA']) {
    it(locale, () => {
      const strings = JSON.parse(readFileSync(new URL(`../../i18n/locales/${locale}/translation.json`, import.meta.url), 'utf8'));
      for (const key of KEYS) assert.equal(typeof strings.postShare?.[key], 'string', `${locale} postShare.${key}`);
    });
  }
});
