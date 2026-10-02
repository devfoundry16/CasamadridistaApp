/**
 * When a contributor's video is compressed on the phone before upload, and to
 * what.
 *
 * Run with:  node --test utils/__tests__/videoCompression.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  COMPRESS_MIN_BYTES,
  TARGET_BITRATE,
  TARGET_LONG_EDGE,
  compressionPlan,
  scaledDimensions,
} from '../videoCompression.core.ts';

const MIB = 1024 * 1024;

/** A clip of `seconds` at `mbps` megabits per second. */
const clip = (seconds: number, mbps: number, width = 1920, height = 1080) => ({
  sizeBytes: Math.round((mbps * 1_000_000 * seconds) / 8),
  durationMs: seconds * 1000,
  width,
  height,
});

describe('compressionPlan', () => {
  it('compresses a big, high-bitrate clip to the target', () => {
    // 60 s of 4K at 45 Mbps: about 320 MB.
    assert.deepEqual(compressionPlan(clip(60, 45, 3840, 2160)), {
      maxSize: TARGET_LONG_EDGE,
      bitrate: TARGET_BITRATE,
    });
  });

  it('leaves a small file alone, whatever its bitrate', () => {
    const small = clip(5, 40);
    assert.ok(small.sizeBytes < COMPRESS_MIN_BYTES);
    assert.equal(compressionPlan(small), null);
  });

  it('leaves a clip alone when it is already near the target bitrate', () => {
    // 5 minutes at 6.5 Mbps is big, but re-encoding it would gain nothing.
    assert.equal(compressionPlan(clip(300, 6.5)), null);
  });

  it('does nothing without a size or a duration to judge by', () => {
    assert.equal(compressionPlan({ sizeBytes: null, durationMs: 60_000, width: 1920, height: 1080 }), null);
    assert.equal(compressionPlan({ sizeBytes: 200 * MIB, durationMs: null, width: 1920, height: 1080 }), null);
    assert.equal(compressionPlan({ sizeBytes: 200 * MIB, durationMs: 0, width: 1920, height: 1080 }), null);
  });
});

describe('scaledDimensions', () => {
  it('scales the long edge down to the target and keeps the shape', () => {
    assert.deepEqual(scaledDimensions(3840, 2160), { width: 1920, height: 1080 });
    assert.deepEqual(scaledDimensions(2160, 3840), { width: 1080, height: 1920 });
  });

  it('never scales up, and keeps even dimensions for the encoder', () => {
    assert.deepEqual(scaledDimensions(1280, 720), { width: 1280, height: 720 });
    assert.deepEqual(scaledDimensions(2000, 1125), { width: 1920, height: 1080 });
    const odd = scaledDimensions(3000, 1687);
    assert.equal(odd.width % 2, 0);
    assert.equal(odd.height % 2, 0);
  });

  it('passes unknown dimensions through as unknown', () => {
    assert.deepEqual(scaledDimensions(null, 1080), { width: null, height: 1080 });
  });
});
