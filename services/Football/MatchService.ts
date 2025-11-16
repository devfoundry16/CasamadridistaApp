import axios, { AxiosInstance } from "axios";
import { development } from "@/config/environment";
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
}
const MatchService = new ApiService();
export default MatchService;
