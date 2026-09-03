import type { PushPayload } from '@/types/media/notifications';

/**
 * Pure half of the push-payload router.
 *
 * Split from `utils/pushPayload.ts` for the same reason as `returnTo.core.ts`
 * and `mediaUrl.core.ts`: this is the security-relevant part (it decides where a
 * notification is allowed to navigate) and it is worth exercising under
 * `node --test`. The scheme is a parameter rather than a module import so this
 * file imports nothing at runtime.
 */

/**
 * Turn a push/inbox `data` blob into an in-app route.
 *
 * The server sends a `casamadridistaapp://…` URL, but `router.push` wants a
 * path. Rather than trusting the string, this rebuilds the route from the typed
 * fields and only falls back to parsing `url` for payload types the app does not
 * know yet — so a malformed or hostile `url` can never navigate anywhere the
 * payload's own ids do not already permit.
 */
export function hrefFromPayloadWithScheme(
  payload: PushPayload | null | undefined,
  scheme: string,
): string | null {
  if (!payload) return null;

  const campaign = payload.campaign_id ? `?c=${encodeURIComponent(payload.campaign_id)}` : '';

  switch (payload.type) {
    case 'media_item':
      return payload.item_id
        ? `/media/item/${encodeURIComponent(payload.item_id)}${campaign}`
        : null;
    case 'media_match':
      return payload.match_id ? `/match/${payload.match_id}/media` : null;
    case 'media_digest':
      // Legacy type — the backend now sends `media_match` for match digests.
      // A digest that names a fixture should still land on that fixture's media
      // rather than the generic hub.
      return payload.match_id ? `/match/${payload.match_id}/media` : '/media';
    case 'custom':
    default:
      return safePathFromUrl(payload.url, scheme);
  }
}

/**
 * Accept only our own scheme, and only its path — never an `https://` link, and
 * never a protocol-relative path that expo-router would treat as external.
 */
export function safePathFromUrl(
  url: string | undefined,
  scheme: string,
): string | null {
  if (!url) return null;
  const prefix = `${scheme}://`;
  if (!url.startsWith(prefix)) return null;
  const rest = url.slice(prefix.length);
  if (!rest || rest.startsWith('/')) return null;
  return `/${rest}`;
}

/** Best-effort coercion of the untyped `data` bag a notification arrives with. */
export function parsePushPayload(data: unknown): PushPayload | null {
  if (!data || typeof data !== 'object') return null;
  const candidate = data as Record<string, unknown>;
  if (typeof candidate.type !== 'string') return null;
  return {
    v: typeof candidate.v === 'number' ? candidate.v : 1,
    type: candidate.type as PushPayload['type'],
    item_id: typeof candidate.item_id === 'string' ? candidate.item_id : undefined,
    match_id: typeof candidate.match_id === 'number' ? candidate.match_id : undefined,
    campaign_id: typeof candidate.campaign_id === 'string' ? candidate.campaign_id : undefined,
    url: typeof candidate.url === 'string' ? candidate.url : undefined,
    web_url: typeof candidate.web_url === 'string' ? candidate.web_url : undefined,
  };
}
