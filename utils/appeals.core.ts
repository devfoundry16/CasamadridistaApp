/**
 * Appeals and warnings on the person's own screen (admin §25). Pure.
 *
 * The API decides — one open appeal per subject, a statement of 10–2000
 * characters — and these rules only keep the screen from offering what it
 * would refuse.
 */

export interface AppealLike {
  id: string;
  subject_kind: string;
  subject_id: string | null;
  status: string;
}

export interface WarningLike {
  id: string;
  withdrawn_at: string | null;
}

const isOpen = (a: AppealLike) => a.status === 'open';

/**
 * @param appealable the server's `restriction_appealable`: restricted, and no
 *        appeal on THIS restriction upheld (it knows when the restriction
 *        began; the app does not).
 */
export function canAppealRestriction(appealable: boolean, appeals: AppealLike[]): boolean {
  return appealable && !appeals.some((a) => isOpen(a) && a.subject_kind === 'restriction');
}

/** A standing warning with no open appeal, and none upheld (one review per decision). */
export function canAppealWarning(warning: WarningLike, appeals: AppealLike[]): boolean {
  if (warning.withdrawn_at) return false;
  return !appeals.some(
    (a) => (isOpen(a) || a.status === 'upheld') && a.subject_kind === 'warning' && a.subject_id === warning.id,
  );
}

const NOTICE_SUBTYPES = ['warning', 'appeal_overturned', 'appeal_upheld'];

/** The i18n key for a safety notice's title, or null to keep the stored title. */
export function safetyNoticeKey(subtype: string | undefined): string | null {
  return subtype && NOTICE_SUBTYPES.includes(subtype) ? `appeals.notice.${subtype}` : null;
}

export const STATEMENT_MIN = 10;
export const STATEMENT_MAX = 2000;

/** 'short' | 'long' | null */
export function statementProblem(text: string): 'short' | 'long' | null {
  const length = text.trim().length;
  if (length < STATEMENT_MIN) return 'short';
  if (length > STATEMENT_MAX) return 'long';
  return null;
}

export function appealStatusKey(status: string): string {
  return status === 'upheld' || status === 'overturned' ? `appeals.status.${status}` : 'appeals.status.open';
}
