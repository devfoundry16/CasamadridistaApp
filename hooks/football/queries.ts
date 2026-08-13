import { useQuery } from "@tanstack/react-query";
import MatchService from "@/services/Football/MatchService";
import StatsService from "@/services/Football/StatsService";
import { useSeason } from "./useSeason";
import { LA_LIGA_LEAGUE_ID } from "@/constants/football";
import type { LeagueStandings, StandingRow } from "@/types/soccer/standings";
import type { TeamStatistics } from "@/types/soccer/teamStatistics";
import type { TopPlayerEntry } from "@/types/soccer/topPlayers";
import type { Match } from "@/types/soccer/match";

export const footballKeys = {
  all: ["football"] as const,
  standings: (l: number, s: number) => [...footballKeys.all, "standings", l, s] as const,
  teamStats: (t: number, l: number, s: number) =>
    [...footballKeys.all, "team-stats", t, l, s] as const,
  topScorers: (l: number, s: number) => [...footballKeys.all, "topscorers", l, s] as const,
  topAssists: (l: number, s: number) => [...footballKeys.all, "topassists", l, s] as const,
  seasonFixtures: (t: number, s: number) =>
    [...footballKeys.all, "season-fixtures", t, s] as const,
  liveMatch: (t: number) => [...footballKeys.all, "live", t] as const,
};

/** staleTime mirrors each server TTL so the client never asks for something
 *  the server would only answer from its own cache. */
const H = 3_600_000;

export function useStandings(leagueId: number = LA_LIGA_LEAGUE_ID) {
  const season = useSeason();
  return useQuery<LeagueStandings[], Error, StandingRow[]>({
    queryKey: footballKeys.standings(leagueId, season),
    queryFn: () => StatsService.fetchStandings(leagueId, season),
    enabled: season > 0,
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

export function useTopScorers(leagueId: number = LA_LIGA_LEAGUE_ID) {
  const season = useSeason();
  return useQuery<TopPlayerEntry[]>({
    queryKey: footballKeys.topScorers(leagueId, season),
    queryFn: () => StatsService.fetchTopScorers(leagueId, season),
    enabled: season > 0,
    staleTime: 6 * H,
  });
}

export function useTopAssists(leagueId: number = LA_LIGA_LEAGUE_ID) {
  const season = useSeason();
  return useQuery<TopPlayerEntry[]>({
    queryKey: footballKeys.topAssists(leagueId, season),
    queryFn: () => StatsService.fetchTopAssists(leagueId, season),
    enabled: season > 0,
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
