/** GET/PUT /notifications/email-preference → whether news emails are on; null when unknown. Pure. */
export function parseEmailPreference(body: unknown): boolean | null {
  const value = (body as { marketing_emails?: unknown } | null)?.marketing_emails;
  return typeof value === 'boolean' ? value : null;
}
