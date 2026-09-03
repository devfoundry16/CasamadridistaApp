/**
 * `GET /api/casa-media/contributor/me` → `ContributorMe`.
 *
 * Split out of `ContributorMediaService` so it can be exercised against a
 * recorded response under `node --test` (that service pulls in axios and
 * AsyncStorage, neither of which loads outside React Native). Pure: no
 * runtime imports.
 */
import type {
  ContributorCategory,
  ContributorLimits,
  ContributorMe,
} from '../../types/media/contributor';

/**
 * Fallback ceilings, used when `/contributor/me` does not state one.
 *
 * These are the caps the *client* has to respect regardless: Cloudflare's
 * Direct Creator Upload tops out at 200 MB, and the plan's picker cap is 20
 * assets. Erring low here only means the app refuses a file the server would
 * have taken, which is a far better failure than a 200 MB upload rejected on
 * arrival at a stadium.
 */
export const DEFAULT_LIMITS: ContributorLimits = {
  maxVideoDurationSec: 600,
  maxVideoBytes: 200 * 1024 * 1024,
  maxImageBytes: 25 * 1024 * 1024,
  maxGalleryAssets: 20,
};

const MB = 1024 * 1024;

function firstNumber(...candidates: unknown[]): number | null {
  for (const candidate of candidates) {
    const n = typeof candidate === 'string' ? Number(candidate) : candidate;
    if (typeof n === 'number' && Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

/**
 * The response is camelCase at the top level (`maxAccessLevel`, `allowedMatches`,
 * `todayMatch`) and keeps a block of deprecated snake_case aliases below it
 * (`contributor`, `allowed_matches`, `today_match`) purely so older clients keep
 * working. Read the camelCase field first — `contributor` is null for a media
 * manager who has no contributor row, and reading `maxAccessLevel` off it would
 * silently downgrade them. `limits` may arrive keyed by raw `app_settings` names
 * (`media.max_upload_mb_video`, in megabytes) or already normalised to bytes.
 */
export function normaliseMe(raw: Record<string, any> | undefined): ContributorMe {
  const data = raw ?? {};
  const contributor = data.contributor ?? null;
  const limits = (data.limits ?? {}) as Record<string, unknown>;

  const maxImageMb = firstNumber(limits['media.max_upload_mb_image'], limits.max_upload_mb_image);
  const maxVideoMb = firstNumber(limits['media.max_upload_mb_video'], limits.max_upload_mb_video);

  return {
    contributor,
    isMediaManager: !!(data.isMediaManager ?? data.is_media_manager),
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
    allowedMatches: data.allowedMatches ?? data.allowed_matches ?? [],
    allowedCategories: (data.allowedCategories ??
      data.allowed_categories ??
      []) as ContributorCategory[],
    todayMatch: data.todayMatch ?? data.today_match ?? null,
    limits: {
      maxVideoDurationSec:
        firstNumber(
          limits.maxVideoDurationSec,
          limits['media.max_video_duration_sec'],
          limits.max_video_duration_sec,
        ) ?? DEFAULT_LIMITS.maxVideoDurationSec,
      maxVideoBytes:
        firstNumber(limits.maxVideoBytes, limits.max_video_bytes) ??
        (maxVideoMb ? maxVideoMb * MB : DEFAULT_LIMITS.maxVideoBytes),
      maxImageBytes:
        firstNumber(limits.maxImageBytes, limits.max_image_bytes) ??
        (maxImageMb ? maxImageMb * MB : DEFAULT_LIMITS.maxImageBytes),
      maxGalleryAssets:
        firstNumber(
          limits.maxGalleryAssets,
          limits['media.max_gallery_assets'],
          limits.max_gallery_assets,
        ) ?? DEFAULT_LIMITS.maxGalleryAssets,
    },
    // A manager helping at the stadium is never held behind review.
    requiresApproval:
      data.requiresApproval ??
      data.requires_approval ??
      (data.isMediaManager || data.is_media_manager ? false : contributor?.requires_approval !== false),
    maxAccessLevel: data.maxAccessLevel ?? contributor?.max_access_level ?? null,
  };
}
