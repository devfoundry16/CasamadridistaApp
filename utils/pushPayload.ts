import { APP_SCHEME } from '@/constants/media';
import type { PushPayload } from '@/types/media/notifications';
import { hrefFromPayloadWithScheme } from './pushPayload.core';

export { parsePushPayload, safePathFromUrl } from './pushPayload.core';

/**
 * Route for a push/inbox payload, bound to this app's URL scheme.
 *
 * The routing rules live in `utils/pushPayload.core.ts` — see there for why the
 * href is rebuilt from the typed fields rather than taken from `data.url`.
 */
export function hrefFromPayload(payload: PushPayload | null | undefined): string | null {
  return hrefFromPayloadWithScheme(payload, APP_SCHEME);
}
