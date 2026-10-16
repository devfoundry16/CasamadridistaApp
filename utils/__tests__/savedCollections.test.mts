/**
 * Saved collections in the app: named folders for saved posts, private to
 * their owner. Names follow the server's rule (savedCollectionRules).
 *
 * Run with:  node --test utils/__tests__/savedCollections.test.mts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
  COLLECTION_NAME_MAX,
  collectionErrorKey,
  collectionNameProblem,
  normaliseCollections,
  toggleCollection,
} from '../savedCollections.core.ts';
import { shareSheetRows } from '../shareSheet.core.ts';

describe('collectionNameProblem', () => {
  it('a name of 1 to 40 characters, once trimmed', () => {
    assert.equal(collectionNameProblem('Away days'), null);
    assert.equal(collectionNameProblem('  x  '), null);
    assert.equal(collectionNameProblem('x'.repeat(COLLECTION_NAME_MAX)), null);
    assert.equal(COLLECTION_NAME_MAX, 40);
  });
  it('empty or too long is refused', () => {
    assert.equal(collectionNameProblem(''), 'invalid_name');
    assert.equal(collectionNameProblem('   '), 'invalid_name');
    assert.equal(collectionNameProblem('x'.repeat(41)), 'invalid_name');
  });
});

describe('normaliseCollections', () => {
  it('keeps each collection with a safe count and cover', () => {
    const out = normaliseCollections({ collections: [
      { id: 'c1', name: 'Away days', post_count: 3, cover_url: 'https://t/1.jpg' },
      { id: 'c2', name: 'Goals', post_count: -1, cover_url: 7 },
      { id: 3, name: 'broken' },
      null,
    ] });
    assert.deepEqual(out, [
      { id: 'c1', name: 'Away days', post_count: 3, cover_url: 'https://t/1.jpg' },
      { id: 'c2', name: 'Goals', post_count: 0, cover_url: null },
    ]);
    assert.deepEqual(normaliseCollections(null), []);
  });
});

describe('toggleCollection', () => {
  it('ticks and unticks one collection, keeping the others', () => {
    assert.deepEqual(toggleCollection(['a'], 'b'), ['a', 'b']);
    assert.deepEqual(toggleCollection(['a', 'b'], 'a'), ['b']);
    assert.deepEqual(toggleCollection([], 'a'), ['a']);
  });
});

describe('collectionErrorKey', () => {
  it('names a taken name, the limit, a bad name, or a generic failure', () => {
    assert.equal(collectionErrorKey('name_taken'), 'social.collections.nameTaken');
    assert.equal(collectionErrorKey('collection_limit'), 'social.collections.limit');
    assert.equal(collectionErrorKey('invalid_name'), 'social.collections.invalidName');
    assert.equal(collectionErrorKey('Network Error'), 'social.collections.failed');
  });
});

describe('the share sheet offers "Save to collection" to anyone signed in', () => {
  it('after the ways out and the playback speed, before your own tools', () => {
    assert.deepEqual(
      shareSheetRows({ isOwn: false, saveable: false, isVideo: true, signedIn: true }),
      ['friends', 'copy_link', 'share', 'qr', 'speed', 'collection'],
    );
    assert.deepEqual(
      shareSheetRows({ isOwn: true, saveable: false, signedIn: true, ownerTools: ['edit'] }),
      ['friends', 'copy_link', 'share', 'qr', 'collection', 'edit', 'delete'],
    );
    assert.equal(shareSheetRows({ isOwn: false, saveable: false }).includes('collection'), false);
  });
});

describe('collection strings exist in both languages', () => {
  const load = (locale: string) =>
    JSON.parse(readFileSync(new URL(`../../i18n/locales/${locale}/translation.json`, import.meta.url), 'utf8'));
  for (const locale of ['en-US', 'ar-SA']) {
    it(locale, () => {
      const all = load(locale);
      const c = all.social.collections;
      for (const key of [
        'all', 'new', 'newTitle', 'namePlaceholder', 'create', 'rename', 'renameTitle', 'save', 'delete',
        'deleteTitle', 'deleteBody', 'saveTo', 'empty', 'emptyCollection', 'done', 'nameTaken', 'limit', 'invalidName', 'failed', 'manage',
      ]) {
        assert.equal(typeof c[key], 'string', `${locale} social.collections.${key}`);
      }
      assert.equal(typeof all.postShare.saveToCollection, 'string', `${locale} postShare.saveToCollection`);
      assert.equal(typeof all.community.saveHint, 'string', `${locale} community.saveHint`);
    });
  }
});
