import type { Match } from "@/types/soccer/match";
import type { Outcome } from "./ResultPill";

/** Status codes API-Football uses for a fixture that has finished. */
const FINISHED = new Set(["FT", "AET", "PEN"]);
/** Status codes for a fixture currently being played. */
const IN_PLAY = new Set(["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT"]);

export function isFinished(m: Match): boolean {
  return FINISHED.has(m.fixture?.status?.short);
}

export function isInPlay(m: Match): boolean {
  return IN_PLAY.has(m.fixture?.status?.short);
}

export function isScheduled(m: Match): boolean {
  return !isFinished(m) && !isInPlay(m);
}

/** The opponent of `teamId` in this fixture. */
export function opponentOf(m: Match, teamId: number) {
  return m.teams.home.id === teamId ? m.teams.away : m.teams.home;
}

export function isHome(m: Match, teamId: number): boolean {
  return m.teams.home.id === teamId;
}

/** Result of the fixture from `teamId`'s point of view. */
export function outcomeFor(m: Match, teamId: number): Outcome {
  if (!isFinished(m)) return "scheduled";
  const { home, away } = m.goals;
  if (home == null || away == null) return "scheduled";
  if (home === away) return "draw";
  const homeWon = home > away;
  return isHome(m, teamId) === homeWon ? "win" : "loss";
}

/** Goals ordered as (team, opponent) rather than (home, away). */
export function goalsFor(m: Match, teamId: number): { own: number | null; other: number | null } {
  return isHome(m, teamId)
    ? { own: m.goals.home, other: m.goals.away }
    : { own: m.goals.away, other: m.goals.home };
}

export function kickoff(m: Match): Date {
  return new Date(m.fixture.date as unknown as string);
}

/** Ascending by kickoff. */
export function byDateAsc(a: Match, b: Match): number {
  return kickoff(a).getTime() - kickoff(b).getTime();
}

/** `2026-08` bucket key, used to group fixtures into months. */
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
