/**
 * Community post helpers that need no device: the media carousel's page under
 * RTL, the free-text location, the report form's rules, and patching a post in
 * the query cache.
 *
 * Type-only imports, so `utils/__tests__/post.test.mts` runs it under
 * `node --test`.
 */
import type { SocialReportReason } from '../types/social';

/* ------------------------------------------------------------------ */
/* Carousel                                                            */
/* ------------------------------------------------------------------ */

/**
 * The logical page a horizontal, paging carousel has settled on.
 *
 * Under RTL a horizontal list lays its first item out at the right-hand end,
 * and `contentOffset.x` counts from the left, so `x / width` is the page
 * counted from the LAST item. Inverting it gives the logical index, which is
 * what the dots and the photo viewer speak.
 *
 * Clamped, because iOS reports overscroll and bounce as offsets outside the
 * content.
 */
export function carouselIndex(offsetX: number, pageWidth: number, count: number, isRTL: boolean): number {
  if (!(pageWidth > 0) || count <= 0 || !Number.isFinite(offsetX)) return 0;
  const page = Math.min(count - 1, Math.max(0, Math.round(offsetX / pageWidth)));
  return isRTL ? count - 1 - page : page;
}

/* ------------------------------------------------------------------ */
/* Location                                                            */
/* ------------------------------------------------------------------ */

/** The backend's `posts.location_name` limit. */
export const LOCATION_MAX = 80;

/**
 * The location as it is sent: trimmed, single-spaced, at most 80 UTF-16 units
 * without splitting a character, and null when empty so the field is left out.
 */
export function normaliseLocation(input: string | null | undefined): string | null {
  const text = String(input ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  if (text.length <= LOCATION_MAX) return text;
  let out = '';
  for (const ch of Array.from(text)) {
    if (out.length + ch.length > LOCATION_MAX) break;
    out += ch;
  }
  return out.trim() || null;
}

/* ------------------------------------------------------------------ */
/* Reports                                                             */
/* ------------------------------------------------------------------ */

/**
 * Posts and comments are reported with the same eight reasons as messages and
 * profiles. Inlined, not imported, so this file stays loadable under
 * `node --test`; `post.test.mts` pins it to `SOCIAL_REPORT_REASONS`.
 */
export const POST_REPORT_REASONS: readonly SocialReportReason[] = [
  'spam',
  'harassment',
  'hate',
  'sexual',
  'impersonation',
  'scam',
  'threat',
  'other',
];

/** A reason is chosen, and "other" says what happened. */
export function reportReady(reason: SocialReportReason | null, description: string): boolean {
  if (!reason) return false;
  return reason !== 'other' || description.trim().length > 0;
}

const REPORT_ERRORS = ['invalid_reason', 'details_required', 'already_reported'];

/**
 * Did the API refuse for want of a signed-in session? The backend's 401 bodies
 * ("No token provided", "Invalid or expired token", "authentication_required")
 * are developer text — show a sign-in prompt instead of passing them through.
 */
export function isAuthRefusal(status: number | null | undefined): boolean {
  return status === 401;
}

/** The i18n key for a report refusal the person can act on, or null. */
export function reportErrorKey(code: string | null | undefined): string | null {
  return code && REPORT_ERRORS.includes(code) ? `community.reportErrors.${code}` : null;
}

/* ------------------------------------------------------------------ */
/* Query cache                                                         */
/* ------------------------------------------------------------------ */

interface HasId { id: string }

/** `post` with `patch` merged in when it is the post `id`; otherwise `post` itself. */
export function patchPost<T extends HasId>(post: T | undefined, id: string, patch: Partial<T>): T | undefined {
  return post && post.id === id ? { ...post, ...patch } : post;
}

/**
 * Patches the post `id` in an infinite feed query's `{ pages: [{ posts }] }`.
 * Pages without it keep their reference, and when no page has it the input
 * comes back unchanged, so React Query notifies nobody.
 */
export function patchPostInPages<T extends HasId, D extends { pages: { posts: T[] }[] }>(
  data: D | undefined,
  id: string,
  patch: Partial<T>,
): D | undefined {
  if (!data || !Array.isArray(data.pages)) return data;
  let changed = false;
  const pages = data.pages.map((page) => {
    if (!Array.isArray(page?.posts) || !page.posts.some((p) => p?.id === id)) return page;
    changed = true;
    return { ...page, posts: page.posts.map((p) => (p?.id === id ? { ...p, ...patch } : p)) };
  });
  return changed ? { ...data, pages } : data;
}

export type FeedMenuAction = 'report' | 'edit' | 'delete';

/**
 * What a post's "..." menu offers. Someone else's post can be reported
 * (signing in is asked for on tap); your own can be edited or deleted. A
 * Casa Media teaser you shared has no title, text or media of its own, so
 * there is nothing to edit.
 */
export function feedMenuActions({ isOwn, kind }: { isOwn: boolean; kind?: string }): FeedMenuAction[] {
  if (!isOwn) return ['report'];
  return kind === 'media_teaser' ? ['delete'] : ['edit', 'delete'];
}

/**
 * An infinite-query cache with one post taken out, after its author deleted
 * it. Pages that did not hold it are kept as the same objects; a cache without
 * it (or none) is returned unchanged.
 */
export function removePostFromPages<T extends HasId, D extends { pages: { posts: T[] }[] }>(
  data: D | undefined,
  id: string,
): D | undefined {
  if (!data || !data.pages.some((p) => p.posts.some((x) => x.id === id))) return data;
  return {
    ...data,
    pages: data.pages.map((p) => (p.posts.some((x) => x.id === id) ? { ...p, posts: p.posts.filter((x) => x.id !== id) } : p)),
  };
}

/**
 * A person's own post: the gate for Save and Delete (share sheet, "..." menu).
 * A fan club or Casa post records its admin or manager as author_id, and is
 * never "theirs" here.
 */
export function isOwnPost(
  post: { author_type?: string | null; author_id?: string | null } | undefined,
  userId: string | null | undefined,
): boolean {
  return !!userId && post?.author_type === 'user' && post.author_id === userId;
}
