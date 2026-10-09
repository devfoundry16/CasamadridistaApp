import { useQuery } from "@tanstack/react-query";
import MatchService from "@/services/Football/MatchService";
import StatsService from "@/services/Football/StatsService";
import { useSeason } from "./useSeason";
import { LA_LIGA_LEAGUE_ID, REAL_MADRID_TEAM_ID } from "@/constants/football";
import type { CompetitionCatalog } from "@/types/soccer/competitions";
import type { LeagueStandings, StandingRow } from "@/types/soccer/standings";
import type { TeamStatistics } from "@/types/soccer/teamStatistics";
import type { Match } from "@/types/soccer/match";
import type { Leaderboard, LeadersHub, TeamLeaders } from "@/types/soccer/leaders";
import { keepWhileSameBoard } from "@/utils/topPlayers.core";

export const footballKeys = {
  all: ["football"] as const,
  competitions: (t: number) => [...footballKeys.all, "competitions", t] as const,
  standings: (l: number, s: number) => [...footballKeys.all, "standings", l, s] as const,
  teamStats: (t: number, l: number, s: number) =>
    [...footballKeys.all, "team-stats", t, l, s] as const,
  seasonFixtures: (t: number, s: number) =>
    [...footballKeys.all, "season-fixtures", t, s] as const,
  liveMatch: (t: number) => [...footballKeys.all, "live", t] as const,
  leaders: (l: number, s: number, p: Record<string, string>) =>
    [...footballKeys.all, "leaders", l, s, p] as const,
  leaderboard: (l: number, s: number, stat: string, p: Record<string, string>) =>
    [...footballKeys.all, "leaderboard", l, s, stat, p] as const,
  teamLeaders: (l: number, s: number) => [...footballKeys.all, "team-leaders", l, s] as const,
};

/** staleTime mirrors each server TTL so the client never asks for something
 *  the server would only answer from its own cache. */
const H = 3_600_000;

/** Which competitions the team has a readable table for, and in which seasons. */
export function useTeamCompetitions(teamId: number = REAL_MADRID_TEAM_ID) {
  return useQuery<CompetitionCatalog>({
    queryKey: footballKeys.competitions(teamId),
    queryFn: () => StatsService.fetchTeamCompetitions(teamId),
    enabled: teamId > 0,
    staleTime: 24 * H,
  });
}

/**
 * `season` and `enabled` are optional so existing callers keep working:
 * `useStandings()` still resolves to La Liga in the current season.
 */
export function useStandings(
  leagueId: number = LA_LIGA_LEAGUE_ID,
  season?: number,
  options?: { enabled?: boolean },
) {
  const fallbackSeason = useSeason();
  const resolvedSeason = season ?? fallbackSeason;
  return useQuery<LeagueStandings[], Error, StandingRow[]>({
    queryKey: footballKeys.standings(leagueId, resolvedSeason),
    queryFn: () => StatsService.fetchStandings(leagueId, resolvedSeason),
    enabled: (options?.enabled ?? true) && resolvedSeason > 0 && leagueId > 0,
    staleTime: 12 * H,
    select: (data) => data?.[0]?.league?.standings?.flat() ?? [],
  });
}

export function useTeamStatistics(teamId: number, leagueId: number = LA_LIGA_LEAGUE_ID) {
  const season = useSeason();
  return useQuery<TeamStatistics>({
    queryKey: footballKeys.teamStats(teamId, leagueId, season),
    queryFn: () => StatsService.fetchTeamStatistics(teamId, leagueId, season),
    enabled: season > 0 && teamId > 0,
    staleTime: 6 * H,
  });
}

export function useSeasonFixtures(teamId: number) {
  const season = useSeason();
  return useQuery<Match[]>({
    queryKey: footballKeys.seasonFixtures(teamId, season),
    queryFn: () => MatchService.fetchSeasonFixtures(teamId, season),
    enabled: season > 0 && teamId > 0,
    staleTime: 15 * 60_000,
  });
}

/** Only poll while something is actually in play. */
export function useLiveMatch(teamId: number, enabled: boolean) {
  return useQuery<Match | null>({
    queryKey: footballKeys.liveMatch(teamId),
    queryFn: () => MatchService.fetchLiveMatch(teamId),
    enabled: enabled && teamId > 0,
    staleTime: 30_000,
    refetchInterval: enabled ? 60_000 : false,
  });
}

/** The sync job refreshes these hourly at most; a past season being prepared is re-asked every 30 s. */
const LEADERS_STALE_MS = 10 * 60_000;
const syncingPoll = (status?: string) => (status === "syncing" ? 30_000 : false);

/** Top Players: the top three of every stat. `params` from leaderParams(). */
export function useLeaders(
  leagueId: number,
  season: number,
  params: Record<string, string>,
  options?: { enabled?: boolean },
) {
  return useQuery<LeadersHub>({
    queryKey: footballKeys.leaders(leagueId, season, params),
    queryFn: () => StatsService.fetchLeaders(leagueId, season, params),
    enabled: (options?.enabled ?? true) && leagueId > 0 && season > 0,
    staleTime: LEADERS_STALE_MS,
    // A filter change keeps the old cards on screen until the new ones land;
    // a new competition or season shows the spinner instead.
    placeholderData: keepWhileSameBoard(leagueId, season),
    refetchInterval: (query) => syncingPoll(query.state.data?.status),
  });
}

/** Top Players "See all": one stat across the competition. */
export function useLeaderboard(
  leagueId: number,
  season: number,
  stat: string,
  params: Record<string, string>,
  options?: { enabled?: boolean },
) {
  return useQuery<Leaderboard>({
    queryKey: footballKeys.leaderboard(leagueId, season, stat, params),
    queryFn: () => StatsService.fetchLeaderboard(leagueId, season, stat, params),
    enabled: (options?.enabled ?? true) && leagueId > 0 && season > 0 && !!stat,
    staleTime: LEADERS_STALE_MS,
    placeholderData: keepWhileSameBoard(leagueId, season),
    refetchInterval: (query) => syncingPoll(query.state.data?.status),
  });
}

export function useTeamLeaders(leagueId: number, season: number, options?: { enabled?: boolean }) {
  return useQuery<TeamLeaders>({
    queryKey: footballKeys.teamLeaders(leagueId, season),
    queryFn: () => StatsService.fetchTeamLeaders(leagueId, season),
    enabled: (options?.enabled ?? true) && leagueId > 0 && season > 0,
    staleTime: LEADERS_STALE_MS,
  });
}
