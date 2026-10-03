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

  /**
   * `/media/item/[id]` is the only route that reads a `surface` param, so it is
   * the only one stamped. A push into a fixture lands on `MatchMediaScreen`,
   * which sets its own surface context (`match`), and overriding that from the
   * href would take a screen's identity away from the screen.
   */
  const itemQuery = [
    payload.campaign_id ? `c=${encodeURIComponent(payload.campaign_id)}` : '',
    'surface=push',
  ]
    .filter(Boolean)
    .join('&');

  switch (payload.type) {
    // Social ids become path segments, so they must be uuids — not merely
    // encoded. A malformed id routes to the list screen instead.
    case 'dm':
      return isUuid(payload.conversation_id) ? `/social/chat/${payload.conversation_id}` : '/social/messages';
    case 'friend_request':
    case 'friend_accept':
      return isUuid(payload.user_id) ? `/user/${payload.user_id}` : '/social/friends';
    // Activity on a post: a like, a comment, a mention (in the post or one of
    // its comments) or a tag. All of them open the post.
    case 'post_like':
    case 'post_comment':
    case 'mention':
    case 'tag':
      return isUuid(payload.post_id) ? `/community/post/${payload.post_id}` : null;
    case 'media_item':
      return payload.item_id
        ? `/media/item/${encodeURIComponent(payload.item_id)}?${itemQuery}`
        : null;
    case 'media_match':
      return payload.match_id ? `/match/${payload.match_id}/media` : null;
    case 'media_digest':
      // Legacy type — the backend now sends `media_match` for match digests.
      // A digest that names a fixture should still land on that fixture's media
      // rather than the generic hub.
      return payload.match_id ? `/match/${payload.match_id}/media` : '/media';
    // An invitation to contribute is accepted in the contributor area. The
    // route is fixed; nothing in the payload can change it.
    case 'contributor_invite':
      return '/contributor';
    // A warning or an appeal decision opens the person's appeals screen.
    case 'safety_notice':
      return '/social/appeals';
    // Mentioned in a story: the author's stories.
    case 'story_mention':
      return isUuid(payload.user_id) ? `/stories/${payload.user_id}` : '/community';
    case 'custom':
    default:
      return safePathFromUrl(payload.url, scheme);
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
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
    // Social fields only when present, so a media payload keeps its exact shape.
    ...(typeof candidate.user_id === 'string' ? { user_id: candidate.user_id } : {}),
    ...(typeof candidate.conversation_id === 'string' ? { conversation_id: candidate.conversation_id } : {}),
    ...(typeof candidate.actor_name === 'string' ? { actor_name: candidate.actor_name } : {}),
    ...(typeof candidate.post_id === 'string' ? { post_id: candidate.post_id } : {}),
    ...(typeof candidate.comment_id === 'string' ? { comment_id: candidate.comment_id } : {}),
    ...(candidate.reply === true ? { reply: true } : {}),
    ...(typeof candidate.subtype === 'string' ? { subtype: candidate.subtype } : {}),
  };
}
