/**
 * Staff refusals from the API (admin §51), for the mobile admin screen.
 *
 * Pure, so `node --test` can load it. The API refuses a staff request when its
 * staff session has ended, when the action needs a recent sign-in, when a
 * second factor is required, or when a money decision needs the finance
 * permission. Each maps to an i18n key the screen shows; anything else is the
 * screen's own error.
 */

type HttpError = { response?: { status?: number; data?: { error?: unknown } } } | null | undefined;

const KEYS: Record<string, string> = {
  '401:session_idle': 'admin.refusal.sessionEnded',
  '401:session_revoked': 'admin.refusal.sessionEnded',
  '403:reauth_required': 'admin.refusal.reauth',
  '403:mfa_required': 'admin.refusal.mfa',
  '403:finance_permission_required': 'admin.refusal.finance',
};

/** The i18n key for a staff refusal, or null when it is not one. */
export function staffRefusalKey(error: unknown): string | null {
  const response = (error as HttpError)?.response;
  if (!response) return null;
  const code = typeof response.data?.error === 'string' ? response.data.error : '';
  return KEYS[`${response.status}:${code}`] ?? null;
}

/**
 * A 401 that means "this staff session is closed", not "this token expired".
 * Refreshing the token keeps the same session, so it would be refused again.
 */
export function isStaffSessionRefusal(status: number | undefined, code: unknown): boolean {
  return status === 401 && (code === 'session_idle' || code === 'session_revoked');
}
