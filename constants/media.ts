/**
 * Casa Media constants.
 *
 * The universal-link domain is an ops decision (see the plan's "Open items"):
 * DNS must point at the Next.js app before `/m/<id>` links resolve. Everything
 * in the app reads it from here so there is exactly one place to change, and
 * `app.json` carries the same literal in `associatedDomains` / `intentFilters`.
 */
export const MEDIA_LINK_DOMAIN =
  process.env.EXPO_PUBLIC_MEDIA_LINK_DOMAIN ?? 'casamadridista.app';

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
