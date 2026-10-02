/**
 * The pure half of on-device video compression.
 *
 * Zero imports, so `utils/__tests__/videoCompression.test.mts` runs it under
 * `node --test`. `services/upload/UploadManager.ts` runs the encoder.
 *
 * Why compress on the phone at all, when Cloudflare re-encodes every upload:
 * the upload is the slow part, and at a stadium the uplink is what decides
 * whether a clip is published during the match or after it. A minute of 1080p
 * off an iPhone is 60 to 130 MB; at 6 Mbps it is about 45 MB and still better
 * than anything the player serves.
 *
 * Only clips the picker accepted reach this: the contributor size cap is
 * checked on the ORIGINAL file (`applyLimits`), so a clip over the cap is
 * refused before compression could have brought it under.
 */

/** Long edge of the compressed clip, in pixels (1080p). */
export const TARGET_LONG_EDGE = 1920;

/** Bits per second of the compressed clip. */
export const TARGET_BITRATE = 6_000_000;

/** Below this a file uploads faster than it would take to re-encode. */
export const COMPRESS_MIN_BYTES = 32 * 1024 * 1024;

/**
 * Re-encoding a clip that is already close to the target costs a minute of
 * battery to save a few megabytes; only clips well above it are worth it.
 */
const WORTHWHILE_RATIO = 1.5;

export interface CompressionPlan {
  /** The encoder's size cap: the long edge. */
  maxSize: number;
  bitrate: number;
}

/**
 * How to compress a picked video, or null to upload it as it is.
 *
 * Judged by size and by the clip's own bitrate (size over duration). A clip
 * the picker could not measure is left alone rather than guessed at.
 */
export function compressionPlan(clip: {
  sizeBytes: number | null;
  durationMs: number | null;
  width: number | null;
  height: number | null;
}): CompressionPlan | null {
  if (!clip.sizeBytes || !clip.durationMs || clip.durationMs <= 0) return null;
  if (clip.sizeBytes < COMPRESS_MIN_BYTES) return null;
  const bitrate = (clip.sizeBytes * 8) / (clip.durationMs / 1000);
  if (bitrate < TARGET_BITRATE * WORTHWHILE_RATIO) return null;
  return { maxSize: TARGET_LONG_EDGE, bitrate: TARGET_BITRATE };
}

const even = (value: number) => Math.max(2, Math.round(value / 2) * 2);

/**
 * The dimensions a clip has after compression: the long edge capped at the
 * target, the shape kept, never scaled up. Even numbers, as encoders produce.
 */
export function scaledDimensions(
  width: number | null,
  height: number | null,
  longEdge: number = TARGET_LONG_EDGE,
): { width: number | null; height: number | null } {
  if (!width || !height) return { width, height };
  const scale = Math.min(1, longEdge / Math.max(width, height));
  if (scale === 1) return { width, height };
  return { width: even(width * scale), height: even(height * scale) };
}
