/**
 * Poll posts (spec 2.1.0 §03). Pure, so `node --test` covers it.
 *
 * The composer checks a poll with the server's own rules
 * (backend services/pollRules.js), so Post is enabled only for a poll the
 * server will take. The card works from the server's tally: counts are null
 * until the viewer may see results (after voting, once closed, or as author).
 */

export const POLL_OPTIONS_MIN = 2;
export const POLL_OPTIONS_MAX = 4;
export const POLL_OPTION_MAX_LENGTH = 80;
export const POLL_DURATIONS = [1, 3, 7] as const;
export type PollDuration = (typeof POLL_DURATIONS)[number];

export interface PollOptionTally {
  id: string;
  label: string;
  count: number | null;
  percent: number | null;
}

export interface PollTally {
  options: PollOptionTally[];
  total: number | null;
  mine: string | null;
  open: boolean;
  closes_at: string;
}

/** The options as the server will store them, or not ok. */
export function validatePollDraft(
  options: string[],
  durationDays: number,
): { ok: true; options: string[] } | { ok: false } {
  const clean = options.map((o) => o.trim());
  if (clean.length < POLL_OPTIONS_MIN || clean.length > POLL_OPTIONS_MAX) return { ok: false };
  if (clean.some((o) => !o || Array.from(o).length > POLL_OPTION_MAX_LENGTH)) return { ok: false };
  if (new Set(clean.map((o) => o.toLocaleLowerCase())).size !== clean.length) return { ok: false };
  if (!(POLL_DURATIONS as readonly number[]).includes(durationDays)) return { ok: false };
  return { ok: true, options: clean };
}

/** What the viewer can do with a poll, from the server's tally. */
export function pollState(
  tally: Pick<PollTally, 'mine' | 'open' | 'total'>,
  { signedIn }: { signedIn: boolean },
): { canVote: boolean; showResults: boolean; askSignIn: boolean } {
  return {
    canVote: signedIn && tally.open,
    // The server sends counts only when this viewer may see them.
    showResults: tally.total !== null,
    askSignIn: !signedIn && tally.open,
  };
}

/** How long until it closes, in the largest whole unit; null once closed. */
export function closesIn(
  closesAt: string,
  now: Date = new Date(),
): { unit: 'days' | 'hours' | 'minutes'; count: number } | null {
  const ms = Date.parse(closesAt) - now.getTime();
  if (!(ms > 0)) return null;
  const minutes = Math.ceil(ms / 60_000);
  if (minutes >= 60 * 24) return { unit: 'days', count: Math.floor(minutes / (60 * 24)) };
  if (minutes >= 60) return { unit: 'hours', count: Math.floor(minutes / 60) };
  return { unit: 'minutes', count: minutes };
}
