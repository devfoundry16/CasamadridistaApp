/**
 * Which line the registration screen shows (B6.1). Pure.
 *
 * A registration with a club from the directory is an application the fan
 * club desk approves or rejects; one naming a club typed by hand has nothing
 * to approve.
 */
const STATUSES = ['pending', 'approved', 'rejected'];

export function registrationStatusKey(reg: { status?: string | null; fan_club_id: string | null }): string {
  if (!reg.fan_club_id || !reg.status || !STATUSES.includes(reg.status)) return 'registration.alreadyRegistered';
  return `registration.status.${reg.status}`;
}
