/**
 * Player ratings, Add to calendar and the kickoff reminder on the match
 * screen, as pure rules. Zero imports, so `utils/__tests__/matchExtras.test.mts`
 * runs it under `node --test`.
 */

/** One rated player, as GET /match/fixture/:id/lineups sends it under `ratings`. */
export interface RatedPlayer {
  id: number;
  name: string | null;
  photo: string | null;
  rating: number;
  minutes: number;
  pos: string | null;
  sub: boolean;
}

export interface MatchRatings {
  home: RatedPlayer[];
  away: RatedPlayer[];
}

export type RatingBand = 'great' | 'good' | 'fair' | 'poor';

/** The colour band of a rating: 8+ great, 7+ good, 6+ fair, below that poor. */
export function ratingBand(rating: number): RatingBand {
  if (rating >= 8) return 'great';
  if (rating >= 7) return 'good';
  if (rating >= 6) return 'fair';
  return 'poor';
}

/** The best-rated players of the match across both sides, best first. */
export function topRated(ratings: MatchRatings | undefined, n = 3): (RatedPlayer & { side: 'home' | 'away' })[] {
  if (!ratings) return [];
  return [
    ...ratings.home.map((p) => ({ ...p, side: 'home' as const })),
    ...ratings.away.map((p) => ({ ...p, side: 'away' as const })),
  ]
    .sort((a, b) => b.rating - a.rating || b.minutes - a.minutes)
    .slice(0, n);
}

/** Each rated player's rating by id, for the lineup rows. */
export function ratingIndex(ratings: MatchRatings | undefined): Map<number, number> {
  const out = new Map<number, number>();
  for (const p of [...(ratings?.home ?? []), ...(ratings?.away ?? [])]) out.set(p.id, p.rating);
  return out;
}

const TWO_HOURS_MS = 2 * 3600_000;
const gcalTime = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** A Google Calendar "new event" link for the match (Android), or null without a kick-off. */
export function calendarTemplateUrl(match: {
  id: number;
  date: string | null;
  home: { name: string | null };
  away: { name: string | null };
  league?: { name?: string | null; round?: string | null };
  venue?: { name?: string | null; city?: string | null };
}): string | null {
  const start = Date.parse(match.date ?? '');
  if (!Number.isFinite(start)) return null;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${match.home.name ?? ''} vs ${match.away.name ?? ''}`,
    dates: `${gcalTime(start)}/${gcalTime(start + TWO_HOURS_MS)}`,
  });
  const location = [match.venue?.name, match.venue?.city].filter(Boolean).join(', ');
  if (location) params.set('location', location);
  const details = [match.league?.name, match.league?.round].filter(Boolean).join(' · ');
  if (details) params.set('details', details);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Minutes before kickoff a reminder may fire, in the order the sheet offers them. */
export const REMINDER_OFFSETS = [60, 15, 0] as const;
export type ReminderOffset = (typeof REMINDER_OFFSETS)[number];

/** A reminder as stored on the phone. */
export interface SavedReminder {
  notificationId: string;
  offsetMin: number;
  kickoff: string;
}

/** When the reminder fires, or null when that moment has passed (or kickoff is unknown). */
export function reminderFireAt(kickoff: string, offsetMin: number, now: Date = new Date()): Date | null {
  const at = Date.parse(kickoff) - offsetMin * 60_000;
  if (!Number.isFinite(at) || at <= now.getTime()) return null;
  return new Date(at);
}

/**
 * What to do with a saved reminder now that the match's kickoff is known:
 * keep it, move it to the new kickoff, or drop it because it can no longer fire.
 */
export function reminderPlan(
  saved: SavedReminder | null,
  kickoff: string,
  now: Date = new Date(),
): 'none' | 'keep' | 'reschedule' | 'drop' {
  if (!saved) return 'none';
  if (!reminderFireAt(kickoff, saved.offsetMin, now)) return 'drop';
  return Date.parse(saved.kickoff) === Date.parse(kickoff) ? 'keep' : 'reschedule';
}
