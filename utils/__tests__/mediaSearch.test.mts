/**
 * When the Casa Media search screen actually runs a search.
 *
 * Run with:  node --test utils/__tests__/mediaSearch.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { MIN_QUERY_LENGTH, canSearch, hasFilter } from '../mediaSearch.core.ts';

describe('canSearch', () => {
  it('a keyword of two characters or more searches by itself', () => {
    assert.equal(canSearch('ab', {}), true);
    assert.equal(MIN_QUERY_LENGTH, 2);
  });

  it('one character and no filter does not', () => {
    assert.equal(canSearch('a', {}), false);
    assert.equal(canSearch('', {}), false);
  });

  it('a filter searches with no keyword at all', () => {
    assert.equal(canSearch('', { type: 'video' }), true);
    assert.equal(canSearch('', { match_id: 1035041 }), true);
  });

  it('a filter does not rescue a one-letter keyword', () => {
    // One letter matches effectively everything; the filter narrows a list, it
    // does not make that query worth sending.
    assert.equal(canSearch('a', { type: 'video' }), false);
  });

  it('a filter left at "all" is not a filter', () => {
    assert.equal(hasFilter({ type: undefined, season: undefined }), false);
    assert.equal(hasFilter({ from: '' }), false);
    assert.equal(hasFilter({ season: 2026 }), true);
  });
});
