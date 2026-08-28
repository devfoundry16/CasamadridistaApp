import type { Competition, CompetitionCatalog } from "@/types/soccer/competitions";
import { LA_LIGA_LEAGUE_ID } from "@/constants/football";

/**
 * The competition + season the table is showing.
 *
 * Always a valid pair. The screen never writes a bare leagueId or season into
 * state — every change goes through a resolver below, so an invalid combination
 * cannot exist in state and therefore cannot be rendered. That, plus the fact
 * that both fields live in ONE state object, is what stops the pills ever
 * showing "FIFA Club World Cup" next to a season that competition never ran in:
 * a snap is one setState, one commit, one frame.
 */
export interface Selection {
  leagueId: number;
  season: number;
}

export function findCompetition(
  catalog: CompetitionCatalog | undefined,
  leagueId: number,
): Competition | undefined {
  return catalog?.competitions.find((c) => c.id === leagueId);
}

/**
 * The pair to open on. La Liga in the current season whenever that exists,
 * which is the common case and costs the user zero taps.
 *
 * Returns null when nothing has a table — a real state in the summer gap, when
 * next season hasn't published and the last one has aged out of the window.
 */
export function initialSelection(
  catalog: CompetitionCatalog,
  preferredSeason: number,
): Selection | null {
  const { competitions } = catalog;
  if (competitions.length === 0) return null;

  const comp =
    competitions.find((c) => c.id === LA_LIGA_LEAGUE_ID) ?? competitions[0];
  const season = comp.seasons.includes(preferredSeason)
    ? preferredSeason
    : comp.seasons[0];

  return { leagueId: comp.id, season };
}

/**
 * Keep the season if the new competition ran that year, otherwise snap to its
 * most recent. Switching from La Liga 2026 to the Club World Cup (2025 only)
 * moves both pills together.
 */
export function selectCompetition(
  catalog: CompetitionCatalog,
  current: Selection,
  leagueId: number,
): Selection {
  const comp = findCompetition(catalog, leagueId);
  if (!comp || comp.seasons.length === 0) return current;

  return {
    leagueId,
    season: comp.seasons.includes(current.season) ? current.season : comp.seasons[0],
  };
}

/**
 * The season list is scoped to the selected competition, so the season is valid
 * by construction. The fallback only covers the option list being a frame stale.
 */
export function selectSeason(
  catalog: CompetitionCatalog,
  current: Selection,
  season: number,
): Selection {
  const comp = findCompetition(catalog, current.leagueId);
  if (comp?.seasons.includes(season)) return { ...current, season };

  const fallback = catalog.competitions.find((c) => c.seasons.includes(season));
  return fallback ? { leagueId: fallback.id, season } : current;
}

/** 2026 -> "26/27". Compact enough for a pill. */
export function formatSeasonShort(season: number): string {
  const next = (season + 1) % 100;
  return `${season % 100}/${String(next).padStart(2, "0")}`;
}

/** 2026 -> "2026/2027". For the picker rows, where there is room. */
export function formatSeasonLong(season: number): string {
  return `${season}/${season + 1}`;
}
