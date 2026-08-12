import type { PostMedia } from '@/services/FeedService';

/**
 * Both feed components render `thumbnail_url` only. The viewer should show and
 * download the highest-fidelity asset available, falling back to the thumbnail
 * when `public_url` is null (older rows, video posters).
 *
 * Note: for images the backend currently derives `thumbnail_url` from the same
 * storage key as `public_url` (see backend/services/mediaService.js — a separate
 * thumbnail is generated for VIDEOS only), and the client resizes uploads to
 * 1600px wide before upload (services/MediaService.ts). So today these usually
 * resolve to the same object; preferring public_url is correctness + headroom.
 */
export function fullResUri(m: PostMedia): string | null {
  return m.public_url ?? m.thumbnail_url ?? null;
}

/** Low-res URI shown instantly underneath the full-res image while it loads. */
export function previewUri(m: PostMedia): string | null {
  return m.thumbnail_url ?? m.public_url ?? null;
}

export function isViewablePhoto(m: PostMedia): boolean {
  return m.kind === 'image' && m.status === 'ready' && !!fullResUri(m);
}

const SAFE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'avif'];

export function extensionFromUrl(url: string, fallback = 'jpg'): string {
  const path = url.split('?')[0].split('#')[0];
  const ext = /\.([a-zA-Z0-9]{2,5})$/.exec(path)?.[1]?.toLowerCase();
  return ext && SAFE_EXTENSIONS.includes(ext) ? ext : fallback;
}

/** iOS refuses to import a file with no/unknown extension — always append one. */
export function downloadFileName(media: PostMedia, url: string, stamp: number): string {
  const id = media.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) || 'photo';
  return `casamadridista-${id}-${stamp}.${extensionFromUrl(url)}`;
}

/** Size of a `contentFit: 'contain'` image inside a box — used for pan bounds. */
export function fitInBox(
  w: number | null | undefined,
  h: number | null | undefined,
  boxW: number,
  boxH: number,
): { width: number; height: number } {
  if (!w || !h || w <= 0 || h <= 0) return { width: boxW, height: boxH };
  const s = Math.min(boxW / w, boxH / h);
  return { width: w * s, height: h * s };
}
