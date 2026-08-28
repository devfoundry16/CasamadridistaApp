import axios, { AxiosInstance } from "axios";
import { development } from "@/config/environment";
import type { CompetitionCatalog } from "@/types/soccer/competitions";
import type { LeagueStandings } from "@/types/soccer/standings";
import type { TeamStatistics } from "@/types/soccer/teamStatistics";
import type { TopPlayerEntry } from "@/types/soccer/topPlayers";

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

  async fetchTopScorers(leagueId: number, season: number): Promise<TopPlayerEntry[]> {
    const { data } = await this.api.get(`/topscorers/${leagueId}/${season}`);
    return data;
  }

  async fetchTopAssists(leagueId: number, season: number): Promise<TopPlayerEntry[]> {
    const { data } = await this.api.get(`/topassists/${leagueId}/${season}`);
    return data;
  }
}

const StatsService = new ApiService();
export default StatsService;
