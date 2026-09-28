/**
 * Picking media: the size/duration ceilings shared by the contributor tools and
 * the Community composer, and the composer's "up to 10 photos, or exactly one
 * video" rule.
 *
 * Run with:  node --test utils/__tests__/mediaPick.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  POST_MEDIA_LIMITS,
  applyLimits,
  cameraOptions,
  libraryRequest,
  mergePostMedia,
  type PickLimits,
  type PickedAsset,
} from '../mediaPick.core.ts';

const photo = (n: number, over: Partial<PickedAsset> = {}): PickedAsset => ({
  uri: `file:///p${n}.jpg`,
  kind: 'image',
  mime: 'image/jpeg',
  width: 1000,
  height: 800,
  durationMs: null,
  sizeBytes: 1000,
  ...over,
});

const video = (n: number, over: Partial<PickedAsset> = {}): PickedAsset => ({
  uri: `file:///v${n}.mp4`,
  kind: 'video',
  mime: 'video/mp4',
  width: 1920,
  height: 1080,
  durationMs: 10_000,
  sizeBytes: 5_000_000,
  ...over,
});

const LIMITS: PickLimits = { maxVideoDurationSec: 60, maxVideoBytes: 10_000_000, maxImageBytes: 2_000_000, maxGalleryAssets: 10 };

describe('applyLimits', () => {
  it('accepts files within the limits', () => {
    const result = applyLimits([photo(1), video(1)], LIMITS);
    assert.equal(result.assets.length, 2);
    assert.deepEqual(result.rejected, []);
    assert.equal(result.cancelled, false);
  });

  it('rejects an oversized photo, an oversized video and a long video, by name', () => {
    const result = applyLimits(
      [photo(1, { sizeBytes: 3_000_000 }), video(1, { sizeBytes: 20_000_000 }), video(2, { durationMs: 61_000 })],
      LIMITS,
    );
    assert.deepEqual(result.assets, []);
    assert.deepEqual(result.rejected, [
      { name: 'p1.jpg', reason: 'image_bytes' },
      { name: 'v1.mp4', reason: 'video_bytes' },
      { name: 'v2.mp4', reason: 'video_duration' },
    ]);
  });

  it('lets an unmeasured file through', () => {
    const result = applyLimits([photo(1, { sizeBytes: null }), video(1, { sizeBytes: null, durationMs: null })], LIMITS);
    assert.equal(result.assets.length, 2);
  });

  it('takes the contributor limits object as it is (same shape)', () => {
    const contributor = { maxVideoDurationSec: 600, maxVideoBytes: 1, maxImageBytes: 1, maxGalleryAssets: 50 };
    assert.equal(applyLimits([photo(1)], contributor).rejected.length, 1);
  });
});

describe('mergePostMedia', () => {
  it('adds photos in order', () => {
    const { assets, dropped } = mergePostMedia([photo(1)], [photo(2), photo(3)]);
    assert.deepEqual(assets.map((a) => a.uri), ['file:///p1.jpg', 'file:///p2.jpg', 'file:///p3.jpg']);
    assert.equal(dropped, null);
  });

  it('caps photos at 10', () => {
    const current = Array.from({ length: 8 }, (_, i) => photo(i));
    const { assets, dropped } = mergePostMedia(current, [photo(100), photo(101), photo(102)]);
    assert.equal(assets.length, POST_MEDIA_LIMITS.maxGalleryAssets);
    assert.equal(assets[9].uri, 'file:///p101.jpg');
    assert.equal(dropped, 'too_many');
  });

  it('one video on its own is accepted', () => {
    const { assets, dropped } = mergePostMedia([], [video(1)]);
    assert.deepEqual(assets.map((a) => a.kind), ['video']);
    assert.equal(dropped, null);
  });

  it('a video picked alongside photos is dropped, the photos kept', () => {
    const { assets, dropped } = mergePostMedia([], [photo(1), video(1), photo(2)]);
    assert.deepEqual(assets.map((a) => a.uri), ['file:///p1.jpg', 'file:///p2.jpg']);
    assert.equal(dropped, 'video_mix');
  });

  it('two videos are refused', () => {
    const { assets, dropped } = mergePostMedia([], [video(1), video(2)]);
    assert.deepEqual(assets, []);
    assert.equal(dropped, 'video_mix');
  });

  it('a video cannot join existing photos', () => {
    const { assets, dropped } = mergePostMedia([photo(1)], [video(1)]);
    assert.deepEqual(assets.map((a) => a.uri), ['file:///p1.jpg']);
    assert.equal(dropped, 'video_mix');
  });

  it('nothing can join a video', () => {
    const { assets, dropped } = mergePostMedia([video(1)], [photo(1)]);
    assert.deepEqual(assets.map((a) => a.uri), ['file:///v1.mp4']);
    assert.equal(dropped, 'video_mix');
  });

  it('keeps extra fields on the items (the composer adds a thumbnail)', () => {
    const { assets } = mergePostMedia([], [{ ...video(1), thumbnailUri: 'file:///t.jpg' }]);
    assert.equal(assets[0].thumbnailUri, 'file:///t.jpg');
  });
});

describe('libraryRequest', () => {
  it('an empty tray: photos or a video, multi-select', () => {
    assert.deepEqual(libraryRequest([]), { selectionLimit: 10, mediaTypes: ['images', 'videos'] });
  });

  it('photos already chosen: only more photos, up to the remainder', () => {
    assert.deepEqual(libraryRequest([photo(1), photo(2)]), { selectionLimit: 8, mediaTypes: ['images'] });
  });

  it('one slot left: still the same multi-select picker, never a crop', () => {
    const nine = Array.from({ length: 9 }, (_, i) => photo(i));
    const request = libraryRequest(nine);
    assert.deepEqual(request, { selectionLimit: 1, mediaTypes: ['images'] });
    assert.equal('allowsEditing' in request!, false);
  });

  it('full, or holding a video: nothing more to pick', () => {
    assert.equal(libraryRequest(Array.from({ length: 10 }, (_, i) => photo(i))), null);
    assert.equal(libraryRequest([video(1)]), null);
  });
});

describe('cameraOptions', () => {
  it('an empty tray can take a photo or record a video', () => {
    assert.deepEqual(cameraOptions([]), { photo: true, video: true });
  });

  it('with photos, only another photo', () => {
    assert.deepEqual(cameraOptions([photo(1)]), { photo: true, video: false });
  });

  it('full, or holding a video: neither', () => {
    assert.deepEqual(cameraOptions(Array.from({ length: 10 }, (_, i) => photo(i))), { photo: false, video: false });
    assert.deepEqual(cameraOptions([video(1)]), { photo: false, video: false });
  });
});
