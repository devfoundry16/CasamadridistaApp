/**
 * The profile's tabs and 3-column grid.
 *
 * Run with:  node --test utils/__tests__/profileGrid.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  GRID_COLUMNS,
  GRID_GAP,
  gridBadge,
  gridCellSize,
  mediaGridCell,
  profileTabs,
} from '../profileGrid.core.ts';

describe('profileTabs', () => {
  it('anyone: Posts, Videos, Tagged', () => {
    assert.deepEqual(profileTabs(false), ['posts', 'videos', 'tagged']);
  });

  it('your own profile adds Saved, last', () => {
    assert.deepEqual(profileTabs(true), ['posts', 'videos', 'tagged', 'saved']);
  });

  it('a Casa Media contributor gets a Media tab, before Saved', () => {
    assert.deepEqual(profileTabs(false, true), ['posts', 'videos', 'tagged', 'media']);
    assert.deepEqual(profileTabs(true, true), ['posts', 'videos', 'tagged', 'media', 'saved']);
  });
});

describe('mediaGridCell', () => {
  const item = {
    id: 'm1',
    type: 'gallery',
    cover_url: 'https://cdn/cover.jpg',
    asset_count: 6,
    published_at: '2026-03-01T19:00:00Z',
  };

  it('a Casa Media item becomes a grid cell with its cover and asset count', () => {
    assert.deepEqual(mediaGridCell(item), {
      id: 'm1',
      kind: 'image',
      thumb_url: 'https://cdn/cover.jpg',
      media_count: 6,
      is_video: false,
      created_at: '2026-03-01T19:00:00Z',
    });
  });

  it('a video item is badged as a video', () => {
    const cell = mediaGridCell({ ...item, type: 'video', asset_count: 1 });
    assert.equal(cell.kind, 'video');
    assert.equal(cell.is_video, true);
    assert.equal(gridBadge(cell), 'video');
  });

  it('an item with no cover and no asset count still counts as one', () => {
    const cell = mediaGridCell({ ...item, type: 'photo', asset_count: 0, cover_url: null });
    assert.equal(cell.thumb_url, null);
    assert.equal(cell.media_count, 1);
    assert.equal(gridBadge(cell), null);
  });
});

describe('gridCellSize', () => {
  it('three square cells and two gaps fill the width', () => {
    const cell = gridCellSize(390);
    assert.equal(GRID_COLUMNS, 3);
    assert.equal(cell, Math.floor((390 - GRID_GAP * 2) / 3));
    assert.ok(cell * 3 + GRID_GAP * 2 <= 390);
  });

  it('matches the Casa Media gallery maths with its page padding', () => {
    // GalleryGrid: floor((width - edge*2 - gap*(cols-1)) / cols), edge 16, gap 2.
    assert.equal(gridCellSize(390, 16), Math.floor((390 - 32 - 4) / 3));
  });

  it('never negative on a tiny or bogus width', () => {
    assert.equal(gridCellSize(0), 0);
    assert.equal(gridCellSize(Number.NaN), 0);
  });
});

describe('gridBadge', () => {
  it('a video shows the video badge', () => {
    assert.equal(gridBadge({ is_video: true, media_count: 1 }), 'video');
  });

  it('several photos show the multi badge', () => {
    assert.equal(gridBadge({ is_video: false, media_count: 3 }), 'multi');
  });

  it('one photo, or a text post, shows none', () => {
    assert.equal(gridBadge({ is_video: false, media_count: 1 }), null);
    assert.equal(gridBadge({ is_video: false, media_count: 0 }), null);
  });

  it('video wins over a count', () => {
    assert.equal(gridBadge({ is_video: true, media_count: 2 }), 'video');
  });
});
