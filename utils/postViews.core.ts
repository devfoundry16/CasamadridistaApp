/**
 * Which posts on screen are new views, for POST /posts/views.
 *
 * The server keeps one view per viewer per post per day, so the app sends each
 * post once per session: the feed used to re-send every visible post on each
 * scroll. Zero imports, so `utils/__tests__/postViews.test.mts` runs it under
 * `node --test`.
 */

/** Most ids one views call may carry (the server's own cap). */
export const VIEWS_BATCH_MAX = 50;

/**
 * The ids in `visible` not sent before, at most VIEWS_BATCH_MAX, recorded in
 * `sent` so a later call skips them. Ids past the cap stay unsent, so they go
 * the next time they are on screen.
 */
export function newlyViewed(sent: Set<string>, visible: readonly string[]): string[] {
  const out: string[] = [];
  for (const id of visible) {
    if (out.length >= VIEWS_BATCH_MAX) break;
    if (typeof id !== 'string' || !id || sent.has(id)) continue;
    sent.add(id);
    out.push(id);
  }
  return out;
}

/** What was sent on one UTC day, per kind of view. */
export interface ViewSession {
  day: string;
  feed: Set<string>;
  open: Set<string>;
}

/**
 * The session to dedupe against: `prev` while it is still the same UTC day,
 * otherwise a fresh one, since the server counts one view per person per day.
 */
export function viewSessionFor(prev: ViewSession | null, now: Date = new Date()): ViewSession {
  const day = now.toISOString().slice(0, 10);
  return prev && prev.day === day ? prev : { day, feed: new Set(), open: new Set() };
}

/** Un-mark ids whose call failed, so they are sent again next time. */
export function forgetViewed(sent: Set<string>, ids: readonly string[]): void {
  for (const id of ids) sent.delete(id);
}
