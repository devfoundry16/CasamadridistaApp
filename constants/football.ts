/**
 * European seasons start in July, so from July onwards the season year is the
 * current calendar year (Aug 2026 -> season 2026).
 *
 * This is only a FALLBACK. The authoritative value comes from the backend via
 * /api/app-info -> useEnvironment().football.currentSeason; read it through
 * `useSeason()` rather than importing this constant into a screen. It exists so
 * that a slow or failed app-info request renders the *current* season's data
 * instead of silently showing last season's table.
 */
export function inferCurrentSeason(now: Date = new Date()): number {
  return now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

/** API-Football season year (start year of the season, e.g. 2026 for 2026-2027). */
export const CURRENT_FOOTBALL_SEASON = inferCurrentSeason();

/** Display label for the current season (e.g. "2026-2027"). */
export const CURRENT_FOOTBALL_SEASON_LABEL = `${CURRENT_FOOTBALL_SEASON}-${CURRENT_FOOTBALL_SEASON + 1}`;

/** Real Madrid CF. */
export const REAL_MADRID_TEAM_ID = 541;

/** Spanish LaLiga. */
export const LA_LIGA_LEAGUE_ID = 140;
