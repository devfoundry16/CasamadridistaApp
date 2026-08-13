import axios, { AxiosInstance } from "axios";
import { development } from "@/config/environment";
import type { Match } from "@/types/soccer/match";
class ApiService {
  private api: AxiosInstance;
  constructor() {
    this.api = axios.create({
      baseURL: `${development.DEFAULT_BACKEND_API_URL}match`,
      headers: { Accept: "application/json" },
    });
  }
  async fetchNextMatch(teamId: number) {
    const { data } = await this.api.get(`/next-match/${teamId}`);
    return data; // Returns the next match object
  }
  async fetchLiveMatch(teamId: number) {
    const { data } = await this.api.get(`/live-match/${teamId}`);
    return data; // Returns the next match object
  }

  async fetchUpcomingMatches(teamId: number, count: number = 5) {
    const { data } = await this.api.get(`/next-matches/${teamId}`);
    return data; // Array of match objects
  }
  async fetchLastMatches(teamId: number, count: number = 5) {
    const { data } = await this.api.get(`/last-matches/${teamId}`);
    return data; // Array of match objects
  }

  /**
   * The team's whole season across every competition, in ONE upstream request.
   * Backs both the Matches list and the calendar — paging by month would cost
   * 10-12 requests plus one on every month change.
   */
  async fetchSeasonFixtures(teamId: number, season?: number): Promise<Match[]> {
    const { data } = await this.api.get(`/season-fixtures/${teamId}`, {
      params: season ? { season } : undefined,
    });
    return data;
  }
}
const MatchService = new ApiService();
export default MatchService;
