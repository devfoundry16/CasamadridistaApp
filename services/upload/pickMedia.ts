import * as ImagePicker from 'expo-image-picker';

import type { ContributorLimits } from '@/types/media/contributor';

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

function fileName(asset: PickedAsset): string {
  const tail = asset.uri.split('/').pop();
  return tail && tail.length ? tail : asset.kind;
}

/**
 * Apply the contributor's server-stated ceilings.
 *
 * Checked here rather than at upload time so the rejection lands next to the
 * picker, while the correspondent is still looking at the file they chose —
 * failing 180 MB into an upload at a stadium is the worst possible moment to
 * learn about a size cap.
 *
 * A missing `sizeBytes`/`durationMs` passes: the picker does not always report
 * either, and refusing an unmeasurable file would block valid uploads.
 */
export function applyLimits(assets: PickedAsset[], limits: ContributorLimits): PickResult {
  const accepted: PickedAsset[] = [];
  const rejected: PickResult['rejected'] = [];

  for (const asset of assets) {
    if (asset.kind === 'video') {
      if (asset.sizeBytes != null && asset.sizeBytes > limits.maxVideoBytes) {
        rejected.push({ name: fileName(asset), reason: 'video_bytes' });
        continue;
      }
      if (
        asset.durationMs != null &&
        asset.durationMs > limits.maxVideoDurationSec * 1000
      ) {
        rejected.push({ name: fileName(asset), reason: 'video_duration' });
        continue;
      }
    } else if (asset.sizeBytes != null && asset.sizeBytes > limits.maxImageBytes) {
      // Photos are downscaled to a 3000 px JPEG before upload, so this only
      // catches something pathological — a 100 MP RAW, a mislabelled file.
      rejected.push({ name: fileName(asset), reason: 'image_bytes' });
      continue;
    }
    accepted.push(asset);
  }

  return { assets: accepted, rejected, cancelled: false };
}

export interface PickOptions {
  limits: ContributorLimits;
  /** Fewer than `limits.maxGalleryAssets` when the item already holds some. */
  selectionLimit?: number;
  mediaTypes?: ImagePicker.MediaType[];
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

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: options.mediaTypes ?? ['images', 'videos'],
    allowsMultipleSelection: true,
    selectionLimit: limit,
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
