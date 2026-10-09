/**
 * Top Players: formatting and filtering for the leaderboards.
 *
 * The backend (utils/playerLeaderRules.js) owns the stat catalog and the
 * ranking; this file only knows the keys, so every label can be checked in
 * both languages, and how to show what came back. Pure, so `node --test`
 * covers it.
 */

export const STAT_GROUPS = ['attack', 'passing', 'defence', 'goalkeeping', 'discipline', 'ratings'] as const;
export type StatGroup = (typeof STAT_GROUPS)[number];

/** The same keys, in the same order, as the backend's STAT_CATALOG. */
export const STAT_KEYS = [
  'goals',
  'assists',
  'goal_contributions',
  'minutes_per_goal',
  'shots',
  'shots_on_target',
  'key_passes',
  'dribbles',
  'penalties_scored',
  'passes',
  'pass_accuracy',
  'tackles',
  'interceptions',
  'duels_won',
  'saves',
  'goals_conceded',
  'yellow_cards',
  'red_cards',
  'average_rating',
  'best_match_rating',
  'match_performances',
] as const;
export type StatKey = (typeof STAT_KEYS)[number];

export const TEAM_STAT_KEYS = [
  'goals_for',
  'goals_against',
  'goals_for_per_game',
  'goals_against_per_game',
  'shots_per_game',
  'key_passes_per_game',
  'yellow_cards',
] as const;
export type TeamStatKey = (typeof TEAM_STAT_KEYS)[number];

export const POSITIONS = ['GK', 'DEF', 'MID', 'FWD'] as const;
export type Position = (typeof POSITIONS)[number];

export type LeaderScope = 'all' | 'team';
export type LeaderMode = 'total' | 'per90';
export type LeaderUnit = 'count' | 'minutes' | 'percent' | 'rating' | 'per90' | 'decimal';

/** The value as a fan reads it. The unit's word, where one is needed, comes from unitSuffixKey. */
export function formatLeaderValue(value: number, unit: LeaderUnit): string {
  switch (unit) {
    case 'percent':
      return `${Math.round(value)}%`;
    case 'rating':
    case 'per90':
    case 'decimal':
      return value.toFixed(2);
    default:
      return String(Math.round(value));
  }
}

/** The translation key for a unit word ("min", "per 90"), or null when the number says it. */
export function unitSuffixKey(unit: LeaderUnit): string | null {
  switch (unit) {
    case 'minutes':
      return 'team.leaders.unit.minutes';
    case 'per90':
      return 'team.leaders.unit.per90';
    case 'decimal':
      return 'team.leaders.unit.perGame';
    default:
      return null;
  }
}

/** The minimum minutes a ranking applies, or null when it applies none. */
export function minMinutesOf(stat: { threshold: number | null }): number | null {
  return stat.threshold && stat.threshold > 0 ? stat.threshold : null;
}

export interface LeaderFilters {
  scope: LeaderScope;
  position: Position | null;
  mode: LeaderMode;
  q?: string;
  limit?: number;
}

/** Query params for the leaders endpoints. Defaults are left out, so cache keys stay few. */
export function leaderParams(filters: LeaderFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.scope !== 'all') params.scope = filters.scope;
  if (filters.position) params.position = filters.position;
  if (filters.mode !== 'total') params.mode = filters.mode;
  const q = filters.q?.trim();
  if (q) params.q = q;
  if (filters.limit) params.limit = String(filters.limit);
  return params;
}

/**
 * The params a stat card's "See all" opens with. The hub ranks a stat that has
 * no per-90 in totals even when Per 90 is on, and the leaderboard endpoint
 * refuses a mode the stat lacks, so the card's own mode is sent.
 */
export function cardParams(filters: LeaderFilters, cardMode: LeaderMode): Record<string, string> {
  return leaderParams({ ...filters, mode: cardMode });
}

/**
 * React Query `placeholderData` for the leaders queries: keep the previous
 * answer on screen while a filter changes, but never across a competition or
 * season, where it would show one board's numbers under another's name.
 * Leaders keys are ["football", kind, leagueId, season, ...].
 */
export function keepWhileSameBoard(leagueId: number, season: number) {
  return <T>(previous: T | undefined, previousQuery: { queryKey: readonly unknown[] } | undefined): T | undefined =>
    previousQuery?.queryKey[2] === leagueId && previousQuery?.queryKey[3] === season ? previous : undefined;
}

/** Lower-case, Latin accents removed, so "goal" finds "Goáls". Arabic passes through. */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * The stat cards to show. A stat the provider does not cover (`available`
 * false) or with nobody ranked under the current filters is hidden, never
 * shown as zeros.
 */
export function visibleStats<T extends { key: string; group: string; available: boolean; entries: unknown[] }>(
  stats: T[],
  { group, search, labelOf }: { group: 'all' | StatGroup; search: string; labelOf: (key: string) => string },
): T[] {
  const needle = fold(search.trim());
  return stats.filter(
    (s) =>
      s.available &&
      s.entries.length > 0 &&
      (group === 'all' || s.group === group) &&
      (!needle || fold(labelOf(s.key)).includes(needle)),
  );
}

/** The player screen only knows our own squad; another club's player would open blank. */
export function canOpenPlayer(teamId: number | null | undefined, ourTeamId: number): boolean {
  return teamId != null && teamId === ourTeamId;
}
