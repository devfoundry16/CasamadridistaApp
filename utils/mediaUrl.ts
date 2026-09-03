import { PixelRatio } from 'react-native';
import type { MediaAsset, MediaItem } from '@/types/media/casaMedia';
import { imageTransformsEnabled, pickWidth, transformCover } from './mediaUrl.core';

export {
  WIDTH_LADDER,
  pickWidth,
  appendWidth,
  transformCover,
  imageTransformsEnabled,
} from './mediaUrl.core';

/**
 * Off unless the project is on a Supabase plan that has the image-transform
 * endpoint. Read once at module load — it is a build-time constant.
 */
const TRANSFORMS_ON = imageTransformsEnabled(
  process.env.EXPO_PUBLIC_SUPABASE_IMAGE_TRANSFORMS,
);

/**
 * Cover URL sized for a card `targetCssWidth` points wide.
 *
 * `expo-image` caches per-URL, so asking for a stable ladder rung (rather than
 * the exact measured width) is what makes the disk cache hit across screens.
 * With transforms off this is the identity function, which is the correct
 * behaviour: the cover is already a right-sized public object.
 */
export function coverUri(
  item: Pick<MediaItem, 'cover_url'>,
  targetCssWidth: number,
): string | null {
  return transformCover(
    item.cover_url,
    pickWidth(targetCssWidth, PixelRatio.get()),
    TRANSFORMS_ON,
  );
}

export function sizedUri(
  url: string | null | undefined,
  targetCssWidth: number,
): string | null {
  return transformCover(url ?? null, pickWidth(targetCssWidth, PixelRatio.get()), TRANSFORMS_ON);
}

/** Full-resolution still for the zoom viewer — never downsized. */
export function assetFullUri(asset: MediaAsset): string | null {
  return asset.url ?? asset.thumbnail_url ?? null;
}

/** Low-res still shown underneath the full-res image while it decodes. */
export function assetPreviewUri(asset: MediaAsset): string | null {
  return asset.thumbnail_url ?? asset.url ?? null;
}

export function isViewableMediaPhoto(asset: MediaAsset): boolean {
  return asset.kind === 'image' && asset.status === 'ready' && !!assetFullUri(asset);
}

export function isPlayableVideo(asset: MediaAsset): boolean {
  return asset.kind === 'video' && asset.status === 'ready' && !!(asset.hls_url ?? asset.url);
}

/** `mm:ss` (or `h:mm:ss`) for duration badges. Never locale-formatted — digits only. */
export function formatDuration(durationMs: number | null | undefined): string | null {
  if (!durationMs || durationMs <= 0) return null;
  const total = Math.round(durationMs / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}
