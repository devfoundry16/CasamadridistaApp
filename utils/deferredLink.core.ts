/**
 * The pure half of a deferred deep link: keeping a shared Casa Media link's
 * destination across a fresh install (§39, "do not lose the destination").
 *
 * A universal link only works once the app is installed. Someone who taps a
 * shared link without the app is sent to the store, and the link is gone by
 * the time the app first opens. Two carriers bring it back:
 *
 *   Android  the Play Store link carries the destination in its install
 *            referrer, which the app can read after install.
 *   iOS      there is no referrer, so the landing page copies the link when
 *            the App Store button is tapped and the app looks for one of our
 *            links on the clipboard at first launch.
 *
 * Both carriers are text an outsider can write, so the only destinations
 * accepted are the two a shared link can name: a media item and a match's
 * media page.
 *
 * Zero imports, so `utils/__tests__/deferredLink.test.mts` runs it under
 * `node --test`. `utils/deferredLink.ts` owns the device calls.
 */

/** Hosts whose links open the app (`app.json` associated domains). */
export const LINK_HOSTS: readonly string[] = ['casamadridista.app', 'www.casamadridista.app'];

/** The referrer parameter that holds the in-app path. Mirrored by the web landing page. */
export const REFERRER_KEY = 'casa_return';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ITEM_PATH = /^\/media\/item\/([^/?#]+)$/;
const MATCH_PATH = /^\/match\/(\d{1,12})\/media$/;

/** An in-app path a shared link is allowed to open, or null. */
function allowedPath(path: string): string | null {
  const item = ITEM_PATH.exec(path);
  if (item) return UUID.test(item[1]) ? `/media/item/${item[1]}` : null;
  return MATCH_PATH.test(path) ? path : null;
}

/** The referrer string a Play Store link should carry for an in-app path. */
export function buildReferrer(path: string): string {
  return `${REFERRER_KEY}=${encodeURIComponent(path)}`;
}

/** The destination in a Play install referrer, or null (an organic install). */
export function pathFromReferrer(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  for (const pair of referrer.split('&')) {
    const at = pair.indexOf('=');
    if (at < 0 || pair.slice(0, at) !== REFERRER_KEY) continue;
    try {
      return allowedPath(decodeURIComponent(pair.slice(at + 1)));
    } catch {
      return null; // broken percent-encoding
    }
  }
  return null;
}

/** The destination of one of our shared links, or null for anything else. */
export function pathFromLink(link: string | null | undefined): string | null {
  if (!link) return null;
  const match = /^https:\/\/([^/?#]+)(\/[^?#]*)?/.exec(link.trim());
  if (!match || !LINK_HOSTS.includes(match[1].toLowerCase())) return null;
  const path = match[2] ?? '/';
  const item = /^\/m\/([^/]+)\/?$/.exec(path);
  if (item) return allowedPath(`/media/item/${item[1]}`);
  return allowedPath(path.replace(/\/$/, ''));
}

/** How long after an install a carried link is still looked for. */
export const FRESH_INSTALL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Was the app installed recently enough to have come from a shared link?
 *
 * This is what keeps an UPDATE from behaving like an install: someone who has
 * had the app for months has no "checked" flag either, and for them the check
 * would mean a paste prompt for whatever link they happened to copy.
 */
export function isFreshInstall(installedAtMs: number | null | undefined, nowMs: number): boolean {
  if (typeof installedAtMs !== 'number' || !Number.isFinite(installedAtMs)) return false;
  const age = nowMs - installedAtMs;
  return age >= 0 && age < FRESH_INSTALL_MS;
}
