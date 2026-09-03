/**
 * Pure half of the cover-URL sizing helper (plan §5.8).
 *
 * No React Native imports, so `pickWidth` / `appendWidth` are exercised by
 * `node --test` (see `utils/__tests__/mediaHelpers.test.mts`). `utils/mediaUrl.ts`
 * supplies the device pixel ratio.
 */

/** Supabase image-transform widths we actually generate. */
export const WIDTH_LADDER = [320, 640, 1080, 1600] as const;

/**
 * Capping at 2 is deliberate: a 3x phone asking for 3x of a full-bleed cover
 * requests a 1600px image for a 390pt card, which is bytes nobody can see.
 */
export const PIXEL_RATIO_CAP = 2;

/**
 * Smallest ladder width that covers `targetCssWidth × min(pixelRatio, cap)`.
 * Falls through to the largest rung when the request exceeds the ladder.
 */
export function pickWidth(
  targetCssWidth: number,
  pixelRatio: number,
  cap: number = PIXEL_RATIO_CAP,
): number {
  const largest = WIDTH_LADDER[WIDTH_LADDER.length - 1];
  if (!Number.isFinite(targetCssWidth) || targetCssWidth <= 0) return WIDTH_LADDER[0];
  const ratio = Number.isFinite(pixelRatio) && pixelRatio > 0 ? pixelRatio : 1;
  const needed = targetCssWidth * Math.min(ratio, cap);
  for (const rung of WIDTH_LADDER) {
    if (rung >= needed) return rung;
  }
  return largest;
}

/** HLS manifests and data URIs are never resized; leave them exactly as-is. */
export function isResizable(url: string): boolean {
  if (!url) return false;
  if (!/^https?:\/\//i.test(url)) return false;
  const path = url.split('?')[0].split('#')[0];
  return !/\.(m3u8|mpd)$/i.test(path);
}

/**
 * Append `w=<width>` to a resizable URL. Idempotent: a URL that already carries
 * a `w` parameter is returned untouched so a signed URL is never mangled twice.
 *
 * Only meaningful on URLs the backend signs with a baked-in width (item and
 * playback assets). Covers are plain public storage URLs — see `transformCover`.
 */
export function appendWidth(url: string | null | undefined, width: number): string | null {
  if (!url) return null;
  if (!isResizable(url)) return url;
  const [beforeHash, hash] = splitOnce(url, '#');
  if (/[?&]w=/.test(beforeHash)) return url;
  const separator = beforeHash.includes('?') ? '&' : '?';
  const withWidth = `${beforeHash}${separator}w=${width}`;
  return hash ? `${withWidth}#${hash}` : withWidth;
}

const PUBLIC_OBJECT_PATH = '/storage/v1/object/public/';
const RENDER_IMAGE_PATH = '/storage/v1/render/image/public/';

/**
 * Cover URLs are plain **public** Supabase storage links — no signing, no
 * server-side sizing. Supabase can resize them, but only through the
 * `/render/image/public/` endpoint, and that endpoint is a **Pro-plan feature**:
 * on a free project it 400s and the cover renders as a blank card.
 *
 * So the rewrite is opt-in via `EXPO_PUBLIC_SUPABASE_IMAGE_TRANSFORMS`, and
 * `enabled: false` (the default) returns the URL byte-for-byte untouched.
 * Appending a bare `?w=` to a public object URL was the previous behaviour and
 * did nothing but bust the CDN cache.
 *
 * @param enabled `process.env.EXPO_PUBLIC_SUPABASE_IMAGE_TRANSFORMS === 'true'`
 */
export function transformCover(
  url: string | null | undefined,
  width: number,
  enabled: boolean,
): string | null {
  if (!url) return null;
  if (!enabled || !isResizable(url)) return url ?? null;
  if (!url.includes(PUBLIC_OBJECT_PATH)) return url;

  const rendered = url.replace(PUBLIC_OBJECT_PATH, RENDER_IMAGE_PATH);
  const [beforeHash, hash] = splitOnce(rendered, '#');
  if (/[?&]width=/.test(beforeHash)) return rendered;
  const separator = beforeHash.includes('?') ? '&' : '?';
  const withWidth = `${beforeHash}${separator}width=${width}`;
  return hash ? `${withWidth}#${hash}` : withWidth;
}

/** Whether Supabase image transforms are enabled for this build. */
export function imageTransformsEnabled(value: string | undefined): boolean {
  return value === 'true';
}

function splitOnce(value: string, delimiter: string): [string, string | null] {
  const index = value.indexOf(delimiter);
  if (index < 0) return [value, null];
  return [value.slice(0, index), value.slice(index + 1)];
}
