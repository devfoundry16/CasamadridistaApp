/**
 * Pure helpers for the match screen's tabs.
 *
 * Kept free of React Native so `node --test` can load them. The server
 * (backend/utils/matchCenterRules.js) already drops what the API did not send;
 * these only decide how the rest is drawn.
 */

/** In-match statistic types from API-Football, with their translation keys. */
const STAT_KEYS: Record<string, string> = {
  'Ball Possession': 'possession',
  expected_goals: 'xg',
  'Total Shots': 'shots',
  'Shots on Goal': 'shotsOn',
  'Shots off Goal': 'shotsOff',
  'Blocked Shots': 'shotsBlocked',
  'Shots insidebox': 'shotsInside',
  'Shots outsidebox': 'shotsOutside',
  'Corner Kicks': 'corners',
  Offsides: 'offsides',
  Fouls: 'fouls',
  'Yellow Cards': 'yellowCards',
  'Red Cards': 'redCards',
  'Goalkeeper Saves': 'saves',
  'Total passes': 'passes',
  'Passes accurate': 'passesAccurate',
  'Passes %': 'passAccuracy',
  goals_prevented: 'goalsPrevented',
};

export const MATCH_STAT_TYPES = Object.keys(STAT_KEYS);

/** Season rows the server sends (matchCenterRules SEASON_ROWS), in order. */
export const SEASON_ROW_KEYS = [
  'played',
  'wins',
  'draws',
  'losses',
  'goals_for',
  'goals_for_avg',
  'goals_against',
  'goals_against_avg',
  'clean_sheets',
  'failed_to_score',
  'home_wins',
  'away_wins',
] as const;

/** The label key of an in-match statistic, or null for one the app does not know. */
export function matchStatKey(type: string): string | null {
  const key = STAT_KEYS[type];
  return key ? `match.center.stat.${key}` : null;
}

const numberOf = (v: unknown): number | null => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const n = Number.parseFloat(v.replace('%', ''));
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

/** Bar widths in percent for a home/away pair, or null when there is nothing to draw. */
export function statShares(home: unknown, away: unknown): { home: number; away: number } | null {
  const h = numberOf(home);
  const a = numberOf(away);
  if (h === null && a === null) return null;
  const total = (h ?? 0) + (a ?? 0);
  if (total <= 0) return null;
  const homeShare = Math.round(((h ?? 0) * 100) / total);
  return { home: homeShare, away: 100 - homeShare };
}

export type PollPick = 'home' | 'draw' | 'away';

export interface PredictionTally {
  counts: Record<PollPick, number>;
  percentages: Record<PollPick, number>;
  total: number;
  mine: PollPick | null;
  open: boolean;
}

/**
 * What the fan poll offers. A signed-in fan votes first and then sees the
 * results, and may change the vote until kickoff. Signed out, the results show
 * with a prompt to sign in. After kickoff it only shows results.
 */
export function pollView(tally: PredictionTally, signedIn: boolean) {
  const canVote = tally.open && signedIn;
  return {
    canVote,
    showResults: !canVote || tally.mine !== null,
    askSignIn: tally.open && !signedIn,
  };
}

/**
 * The state of a tab that needs two queries: its own and the header's
 * summary (team names and crests). Loading while either loads, failed while
 * either failed, so the tab never says "no data" in the meantime.
 */
export function combinedState(
  a: { isPending: boolean; isError: boolean },
  b: { isPending: boolean; isError: boolean },
): { isPending: boolean; isError: boolean } {
  const isError = a.isError || b.isError;
  return { isPending: !isError && (a.isPending || b.isPending), isError };
}

const MINUTE = 60_000;

/**
 * How often to refresh the header. Every minute while live, and in the two
 * hours before kickoff (lineups land, and a delayed kickoff stays "not
 * started" past its time). Otherwise not at all.
 */
export function summaryPollMs(
  match: { state: string; date: string } | undefined,
  now = Date.now(),
): number | false {
  if (!match) return false;
  if (match.state === 'live') return MINUTE;
  if (match.state !== 'upcoming') return false;
  const untilKickoff = Date.parse(match.date) - now;
  return Number.isFinite(untilKickoff) && untilKickoff < 2 * 60 * MINUTE ? MINUTE : false;
}
