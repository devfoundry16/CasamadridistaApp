/**
 * Outbound request bodies whose field names are part of the backend contract.
 *
 * The counterpart to `normalise.ts`: that module owns what we read, this one
 * owns what we send. Both are pure and import nothing at runtime, so
 * `utils/__tests__/contract.test.mts` can assert the exact keys the server
 * parses — `event_type` (not `name`) and `expo_push_token` (not `token`). Both
 * were wrong once; a test is cheaper than finding out from an empty dashboard.
 */
import type { MediaAnalyticsEvent, MediaEventName, MediaEventType } from '../../types/media/casaMedia';
import type { DeviceRegistration } from '../../types/media/notifications';

/**
 * Legacy call-site names → the server's vocabulary
 * (`eventService.EVENT_TYPES`). Anything not listed here is already a valid
 * `event_type` and passes through unchanged.
 */
const EVENT_ALIASES: Record<string, MediaEventType> = {
  signup_cta_click: 'cta_click',
  share_click: 'share',
};

export function toEventType(name: MediaEventName): MediaEventType {
  return EVENT_ALIASES[name] ?? (name as MediaEventType);
}

/**
 * `POST /api/casa-media/events`.
 *
 * `anon_id` is mandatory on every event, not just the anonymous ones: signup
 * attribution joins the pre-signup `locked_view` to the account by anon_id, and
 * an event that omits it cannot be joined afterwards.
 */
export function buildEventsBody(events: MediaAnalyticsEvent[]): { events: MediaAnalyticsEvent[] } {
  return { events };
}

export interface DeviceBodyInput {
  expoPushToken: string;
  platform: 'ios' | 'android' | 'web';
  anonId: string;
  deviceName?: string | null;
  appVersion?: string | null;
  locale?: string | null;
  countryCode?: string | null;
  timezone?: string | null;
  topics?: string[];
}

/**
 * `POST /api/notifications/devices`. `deviceService.upsertDevice` reads
 * `expo_push_token` and rejects the request outright without it.
 */
export function buildDeviceBody(input: DeviceBodyInput): DeviceRegistration {
  return {
    expo_push_token: input.expoPushToken,
    platform: input.platform,
    device_name: input.deviceName ?? null,
    app_version: input.appVersion ?? null,
    locale: input.locale ?? null,
    ...(input.countryCode ? { country_code: input.countryCode } : {}),
    timezone: input.timezone ?? null,
    anon_id: input.anonId,
    ...(input.topics ? { topics: input.topics } : {}),
  };
}

/**
 * Ownership proof for `DELETE /devices/:token` and `PATCH /devices/:token/topics`.
 *
 * A push token is not proof of ownership, so `callerOf()` on the backend takes
 * the account *or* a matching `anon_id` — from the body or the `x-anon-id`
 * header. A DELETE body is not always forwarded by proxies, so send both.
 */
export function anonIdHeader(anonId: string | null | undefined): Record<string, string> {
  return anonId ? { 'x-anon-id': anonId } : {};
}

/** Widths the backend whitelists for `?w=` (contract addendum); default 1080. */
export const SIGNED_WIDTHS = [480, 1080, 2048] as const;

export type SignedWidth = (typeof SIGNED_WIDTHS)[number];

/** Smallest whitelisted width that covers `targetPx`. Anything else is rejected server-side. */
export function pickSignedWidth(targetPx: number): SignedWidth {
  if (!Number.isFinite(targetPx) || targetPx <= 0) return 1080;
  for (const width of SIGNED_WIDTHS) {
    if (width >= targetPx) return width;
  }
  return SIGNED_WIDTHS[SIGNED_WIDTHS.length - 1];
}
