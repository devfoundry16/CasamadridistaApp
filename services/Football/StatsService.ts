import axios, { AxiosInstance } from "axios";
import { development } from "@/config/environment";
import type { CompetitionCatalog } from "@/types/soccer/competitions";
import type { LeagueStandings } from "@/types/soccer/standings";
import type { TeamStatistics } from "@/types/soccer/teamStatistics";
import type { Leaderboard, LeadersHub, TeamLeaders } from "@/types/soccer/leaders";

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${development.DEFAULT_BACKEND_API_URL}stats`,
      headers: { Accept: "application/json" },
      timeout: 15_000,
    });
  }

  /** The competitions a team has a table for, with the seasons available for each. */
  async fetchTeamCompetitions(teamId: number): Promise<CompetitionCatalog> {
    const { data } = await this.api.get(`/competitions/${teamId}`);
    return data;
  }

  async fetchStandings(leagueId: number, season: number): Promise<LeagueStandings[]> {
    const { data } = await this.api.get(`/standings/${leagueId}/${season}`);
    return data;
  }

  async fetchTeamStatistics(
    teamId: number,
    leagueId: number,
    season: number,
  ): Promise<TeamStatistics> {
    const { data } = await this.api.get(
      `/team-statistics/${teamId}/${leagueId}/${season}`,
    );
    return data;
  }

  /** Top Players: the top three of every stat. `params` from leaderParams(). */
  async fetchLeaders(
    leagueId: number,
    season: number,
    params: Record<string, string>,
  ): Promise<LeadersHub> {
    const { data } = await this.api.get(`/leaders/${leagueId}/${season}`, { params });
    return data;
  }

  /** Top Players "See all": one stat, ranked across the competition. */
  async fetchLeaderboard(
    leagueId: number,
    season: number,
    stat: string,
    params: Record<string, string>,
  ): Promise<Leaderboard> {
    const { data } = await this.api.get(
      `/leaders/${leagueId}/${season}/${encodeURIComponent(stat)}`,
      { params },
    );
    return data;
  }

  async fetchTeamLeaders(leagueId: number, season: number): Promise<TeamLeaders> {
    const { data } = await this.api.get(`/team-leaders/${leagueId}/${season}`);
    return data;
  }
}

const StatsService = new ApiService();
export default StatsService;
