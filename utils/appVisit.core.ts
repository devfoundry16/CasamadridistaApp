/**
 * The app's daily visit report, for the analytics funnel's Visitor step
 * (backend POST /api/app/visit). Pure, so `node --test` can load it.
 *
 * It sends the install id (a random id made on this device — see
 * AnalyticsService.getAnonId), the platform and the app version. Nothing about
 * the person or the device itself.
 */

/** At most once a day; a little under 24 h, so a daily habit is not missed. */
export const VISIT_EVERY_MS = 20 * 3600_000;

export function shouldReportVisit(lastReportedIso: string | null, now: number): boolean {
  if (!lastReportedIso) return true;
  const last = Date.parse(lastReportedIso);
  // Unreadable, or in the future (the clock moved): report again.
  if (!Number.isFinite(last) || last > now) return true;
  return now - last >= VISIT_EVERY_MS;
}

export function visitBody(anonId: string, platform: string, appVersion: string | null | undefined) {
  return {
    anon_id: anonId,
    platform: platform === 'ios' || platform === 'android' ? platform : null,
    app_version: appVersion ?? null,
  };
}
