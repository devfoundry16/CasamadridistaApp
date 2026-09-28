import * as ImagePicker from 'expo-image-picker';

import {
  applyLimits,
  type PickLimits,
  type PickResult,
  type PickedAsset,
} from '@/utils/mediaPick.core';

// Re-exported so the contributor screens keep importing from here.
export { applyLimits };
export type { PickLimits, PickResult, PickedAsset };

function toPicked(asset: ImagePicker.ImagePickerAsset): PickedAsset {
  const isVideo = asset.type === 'video';
  return {
    uri: asset.uri,
    kind: isVideo ? 'video' : 'image',
    mime: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
    width: asset.width || null,
    height: asset.height || null,
    // expo-image-picker reports video duration in milliseconds.
    durationMs: isVideo ? (asset.duration ?? null) : null,
    sizeBytes: asset.fileSize ?? null,
  };
}

export interface PickOptions {
  /** A contributor's server-stated `ContributorLimits`, or `POST_MEDIA_LIMITS`. */
  limits: PickLimits;
  /** Fewer than `limits.maxGalleryAssets` when the item already holds some. */
  selectionLimit?: number;
  mediaTypes?: ImagePicker.MediaType[];
  /**
   * Offer the system crop. The OS can only crop a single file, so this turns
   * multi-select off.
   */
  allowsEditing?: boolean;
}

/**
 * The Quick Post picker: multi-select, ordered, capped by the contributor's
 * own limits.
 *
 * `orderedSelection` matters — a gallery's asset order is the order the
 * correspondent tapped, and iOS otherwise returns library order, which for a
 * match-day burst is not the same thing.
 */
export async function pickFromLibrary(options: PickOptions): Promise<PickResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { assets: [], rejected: [], cancelled: true, denied: 'library' };

  const limit = Math.max(1, options.selectionLimit ?? options.limits.maxGalleryAssets);
  const crop = !!options.allowsEditing;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: options.mediaTypes ?? ['images', 'videos'],
    allowsMultipleSelection: !crop,
    selectionLimit: crop ? 1 : limit,
    allowsEditing: crop,
    orderedSelection: true,
    quality: 1,
    exif: false,
    videoMaxDuration: options.limits.maxVideoDurationSec,
  });

  if (result.canceled) return { assets: [], rejected: [], cancelled: true };
  return applyLimits(result.assets.map(toPicked), options.limits);
}

/** Camera capture — the secondary path (plan §5.5). */
export async function captureWithCamera(
  options: PickOptions & { video?: boolean },
): Promise<PickResult> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return { assets: [], rejected: [], cancelled: true, denied: 'camera' };

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: options.video ? ['videos'] : ['images'],
    // Crop applies to stills only.
    allowsEditing: !options.video && !!options.allowsEditing,
    quality: 1,
    exif: false,
    videoMaxDuration: options.limits.maxVideoDurationSec,
  });

  if (result.canceled) return { assets: [], rejected: [], cancelled: true };
  return applyLimits(result.assets.map(toPicked), options.limits);
}

/**
 * The item type a set of picked files implies.
 *
 * One video is a `video`; anything with more than one file is a `gallery`; a
 * lone photo is a `photo`. A mixed multi-select is a gallery — the schema
 * allows both kinds of asset under one item.
 */
export function inferItemType(assets: PickedAsset[]): 'photo' | 'video' | 'gallery' {
  if (assets.length > 1) return 'gallery';
  return assets[0]?.kind === 'video' ? 'video' : 'photo';
}
