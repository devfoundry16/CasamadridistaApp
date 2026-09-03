/**
 * Pure half of the pending-returnTo store.
 *
 * Deliberately free of React Native / AsyncStorage imports so the TTL and
 * consume rules can be exercised by `node --test` (see
 * `utils/__tests__/mediaHelpers.test.mts`). `utils/returnTo.ts` is the thin
 * AsyncStorage shell around these functions.
 */

export const RETURN_TO_STORAGE_KEY = 'casa_media_pending_return_to';

/** Survives the OAuth browser round-trip *and* a cold start; a day is plenty. */
export const RETURN_TO_TTL_MS = 24 * 60 * 60 * 1000;

export interface PendingReturnTo {
  /** Route to land on after auth, e.g. `/media/item/<uuid>`. */
  href: string;
  /** Set when the gate was triggered from a media item — drives attribution. */
  mediaId?: string;
  campaignId?: string;
  /** Epoch ms the intent was recorded. */
  savedAt: number;
}

export type PendingReturnToInput = Omit<PendingReturnTo, 'savedAt'>;

/**
 * An href must be an in-app absolute path. Anything else (an `http(s)` URL, a
 * `javascript:` string, a relative fragment) is refused: this value is fed
 * straight to `router.replace`, and it is written before an untrusted browser
 * round-trip.
 */
export function isSafeReturnHref(href: unknown): href is string {
  return (
    typeof href === 'string' &&
    href.length > 0 &&
    href.length <= 512 &&
    href.startsWith('/') &&
    !href.startsWith('//')
  );
}

export function buildReturnTo(
  input: PendingReturnToInput,
  now: number,
): PendingReturnTo | null {
  if (!isSafeReturnHref(input.href)) return null;
  return {
    href: input.href,
    ...(input.mediaId ? { mediaId: input.mediaId } : {}),
    ...(input.campaignId ? { campaignId: input.campaignId } : {}),
    savedAt: now,
  };
}

export function isFresh(
  entry: PendingReturnTo,
  now: number,
  ttlMs: number = RETURN_TO_TTL_MS,
): boolean {
  // A clock that moved backwards (timezone change, NTP correction) must not
  // resurrect an entry forever, but a small negative delta is normal — treat any
  // future-stamped entry as fresh rather than dropping the user's intent.
  const age = now - entry.savedAt;
  return age < ttlMs;
}

export function parseReturnTo(raw: string | null): PendingReturnTo | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const candidate = parsed as Record<string, unknown>;
  if (!isSafeReturnHref(candidate.href)) return null;
  if (typeof candidate.savedAt !== 'number' || !Number.isFinite(candidate.savedAt)) {
    return null;
  }
  return {
    href: candidate.href,
    ...(typeof candidate.mediaId === 'string' ? { mediaId: candidate.mediaId } : {}),
    ...(typeof candidate.campaignId === 'string'
      ? { campaignId: candidate.campaignId }
      : {}),
    savedAt: candidate.savedAt,
  };
}

/**
 * The whole consume rule in one pure function: parse, drop if malformed or
 * expired, otherwise hand it back. The caller always clears storage afterwards —
 * a pending intent is single-use either way.
 */
export function consumeReturnTo(
  raw: string | null,
  now: number,
  ttlMs: number = RETURN_TO_TTL_MS,
): PendingReturnTo | null {
  const entry = parseReturnTo(raw);
  if (!entry) return null;
  return isFresh(entry, now, ttlMs) ? entry : null;
}
