/**
 * The pure half of picking media from the library or the camera.
 *
 * Zero imports, so `utils/__tests__/mediaPick.test.mts` runs it under
 * `node --test`. `services/upload/pickMedia.ts` owns the expo-image-picker
 * calls and re-exports what its callers already import from it.
 *
 * Two users: the contributor tools (Quick Post, the item editor), whose limits
 * come from the server as `ContributorLimits`, and the Community composer,
 * which uses `POST_MEDIA_LIMITS`.
 */

export interface PickedAsset {
  uri: string;
  kind: 'image' | 'video';
  mime: string;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  sizeBytes: number | null;
}

export interface PickResult {
  assets: PickedAsset[];
  /** Files the picker returned but the limits reject, already explained. */
  rejected: { name: string; reason: 'video_bytes' | 'image_bytes' | 'video_duration' }[];
  cancelled: boolean;
  /** Set when the OS refused the permission outright. */
  denied?: 'library' | 'camera';
}

/**
 * The ceilings a pick is checked against. `ContributorLimits` has exactly this
 * shape, so a contributor's server-stated limits pass straight in.
 */
export interface PickLimits {
  maxVideoDurationSec: number;
  maxVideoBytes: number;
  maxImageBytes: number;
  /** How many files one pick may return. */
  maxGalleryAssets: number;
}

/**
 * A Community post: up to 10 photos, or exactly one video of up to a minute.
 *
 * Photos are downscaled to a 1600 px JPEG before upload, so the image ceiling
 * only catches something pathological. The video is uploaded as picked.
 */
export const POST_MEDIA_LIMITS: PickLimits = {
  maxVideoDurationSec: 60,
  maxVideoBytes: 100 * 1024 * 1024,
  maxImageBytes: 50 * 1024 * 1024,
  maxGalleryAssets: 10,
};

function fileName(asset: PickedAsset): string {
  const tail = asset.uri.split('/').pop();
  return tail && tail.length ? tail : asset.kind;
}

/**
 * Apply the size and duration ceilings.
 *
 * Checked here rather than at upload time so the rejection lands next to the
 * picker, while the person is still looking at the file they chose — failing
 * 180 MB into an upload at a stadium is the worst possible moment to learn
 * about a size cap.
 *
 * A missing `sizeBytes`/`durationMs` passes: the picker does not always report
 * either, and refusing an unmeasurable file would block valid uploads.
 */
export function applyLimits(assets: PickedAsset[], limits: PickLimits): PickResult {
  const accepted: PickedAsset[] = [];
  const rejected: PickResult['rejected'] = [];

  for (const asset of assets) {
    if (asset.kind === 'video') {
      if (asset.sizeBytes != null && asset.sizeBytes > limits.maxVideoBytes) {
        rejected.push({ name: fileName(asset), reason: 'video_bytes' });
        continue;
      }
      if (asset.durationMs != null && asset.durationMs > limits.maxVideoDurationSec * 1000) {
        rejected.push({ name: fileName(asset), reason: 'video_duration' });
        continue;
      }
    } else if (asset.sizeBytes != null && asset.sizeBytes > limits.maxImageBytes) {
      rejected.push({ name: fileName(asset), reason: 'image_bytes' });
      continue;
    }
    accepted.push(asset);
  }

  return { assets: accepted, rejected, cancelled: false };
}

/* ------------------------------------------------------------------ */
/* The Community composer                                              */
/* ------------------------------------------------------------------ */

type Kinded = { kind: 'image' | 'video' };

/**
 * Add a pick to the composer's tray under "up to 10 photos, or exactly one
 * video". Anything that breaks the rule is dropped and named, so the composer
 * can say why; the rest is kept in the order it was picked.
 */
export function mergePostMedia<T extends Kinded>(
  current: readonly T[],
  incoming: readonly T[],
  max: number = POST_MEDIA_LIMITS.maxGalleryAssets,
): { assets: T[]; dropped: 'video_mix' | 'too_many' | null } {
  if (current.some((a) => a.kind === 'video')) {
    return { assets: [...current], dropped: incoming.length ? 'video_mix' : null };
  }

  const videos = incoming.filter((a) => a.kind === 'video');
  if (videos.length === 1 && incoming.length === 1 && current.length === 0) {
    return { assets: [...videos], dropped: null };
  }

  const photos = [...current, ...incoming.filter((a) => a.kind === 'image')];
  const tooMany = photos.length > max;
  return {
    assets: photos.slice(0, max),
    dropped: videos.length ? 'video_mix' : tooMany ? 'too_many' : null,
  };
}

/**
 * How to open the library for the tray as it stands, or null when nothing more
 * can be added.
 *
 * Never with crop. iOS and Android can only crop when the picker is limited to
 * one file, and how many photos someone will choose is only known once the
 * picker returns, so a library crop would mean taking multi-select away from
 * the common case. A cropped single photo is a separate pick
 * (`libraryCropRequest`), offered beside this one in `MediaPicker`, as is the
 * crop on camera stills.
 */
export function libraryRequest(
  current: readonly Kinded[],
  max: number = POST_MEDIA_LIMITS.maxGalleryAssets,
  only?: 'images' | 'videos',
): { selectionLimit: number; mediaTypes: ('images' | 'videos')[] } | null {
  if (current.some((a) => a.kind === 'video')) return null;
  // Create → Video: one video, on an empty tray (a post never mixes them).
  if (only === 'videos') return current.length ? null : { selectionLimit: 1, mediaTypes: ['videos'] };
  const remaining = max - current.length;
  if (remaining <= 0) return null;
  if (only === 'images') return { selectionLimit: remaining, mediaTypes: ['images'] };
  return {
    selectionLimit: remaining,
    mediaTypes: current.length ? ['images'] : ['images', 'videos'],
  };
}

/**
 * One library photo with the OS crop (spec §3, "crop/edit where supported").
 * Neither platform crops inside a multi-select, so this is its own, single
 * pick; null when the tray is full or holds a video (a post never mixes them).
 */
export function libraryCropRequest(
  current: readonly Kinded[],
  max: number = POST_MEDIA_LIMITS.maxGalleryAssets,
): { selectionLimit: 1; mediaTypes: ['images']; allowsEditing: true } | null {
  if (current.some((a) => a.kind === 'video') || current.length >= max) return null;
  return { selectionLimit: 1, mediaTypes: ['images'], allowsEditing: true };
}

/** What the camera may add to the tray as it stands. */
export function cameraOptions(
  current: readonly Kinded[],
  max: number = POST_MEDIA_LIMITS.maxGalleryAssets,
): { photo: boolean; video: boolean } {
  const hasVideo = current.some((a) => a.kind === 'video');
  return {
    photo: !hasVideo && current.length < max,
    video: current.length === 0,
  };
}

/** `media_items.video_format`: how a video item is shaped, so the player can
 *  give a vertical clip a tall frame instead of letterboxing it at 16:9. */
export type VideoFormat = 'vertical_short' | 'horizontal' | 'long';

/** A landscape clip longer than this is a "longer video" rather than a clip. */
const LONG_VIDEO_MS = 3 * 60 * 1000;

/**
 * The format a picked video should be filed as. Null for a photo, or when the
 * picker reported no dimensions — the item is then left for the contributor to
 * set by hand rather than guessed.
 */
export function videoFormatFor(asset: PickedAsset): VideoFormat | null {
  if (asset.kind !== 'video' || !asset.width || !asset.height) return null;
  if (asset.height > asset.width) return 'vertical_short';
  return (asset.durationMs ?? 0) > LONG_VIDEO_MS ? 'long' : 'horizontal';
}
