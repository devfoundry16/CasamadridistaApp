/**
 * Casa Media constants.
 *
 * The universal-link domain is the host the Next.js app is served on — the
 * admin dashboard's, which also serves the public `/m/<id>` pages and the two
 * `/.well-known` files. Only `/m` and `/match` are claimed as app links. Everything
 * in the app reads it from here so there is exactly one place to change, and
 * `app.json` carries the same literal in `associatedDomains` / `intentFilters`.
 */
export const MEDIA_LINK_DOMAIN =
  process.env.EXPO_PUBLIC_MEDIA_LINK_DOMAIN ?? 'dashboard.casamadridista.com';

/** Must match app.json "scheme". */
export const APP_SCHEME = 'casamadridistaapp';

/** Shareable https link — the Next app renders OG tags and an "Open in app" CTA. */
export function mediaWebUrl(itemId: string): string {
  return `https://${MEDIA_LINK_DOMAIN}/m/${itemId}`;
}

/** In-app deep link. Identical shape to the `url` in a push payload. */
export function mediaDeepLink(itemId: string): string {
  return `${APP_SCHEME}://media/item/${itemId}`;
}
