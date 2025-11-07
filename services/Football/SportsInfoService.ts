import axios, { AxiosInstance } from "axios";
import { BACKEND_BASE_API_URL } from "@env";
class ApiService {
  private api: AxiosInstance;
  constructor() {
    this.api = axios.create({
      baseURL: `${BACKEND_BASE_API_URL}/profile`,
      headers: { Accept: "application/json" },
    });
  }
  async fetchTeamsInLeague(leagueId: number, season: number) {
    const { data } = await this.api.get(`/teams/${leagueId}/${season}`);
    return data;
  }

  async fetchLeagueById(leagueId: number) {
    const { data } = await this.api.get(`/league/${leagueId}`);
    return data;
  }

  async fetchTeamInfo(id: number) {
    const { data } = await this.api.get(`/team/${id}`);
    return data;
  }
  async fetchSquad(id: number | undefined) {
    const { data } = await this.api.get(`/squad/${id}`);
    return data;
  }
  async fetchProfile(id: number) {
    const { data } = await this.api.get(`/profile/${id}`);
    return data;
  }
  async fetchCoachProfile(id: number) {
    const { data } = await this.api.get(`/coach/${id}`);
    return data;
  }
  async fetchCountryFlag(country: string) {
    const { data } = await this.api.get(`/flag/${country}`);
    return data;
  }
  async fetchVenueById(id: number) {
    const { data } = await this.api.get(`/venue/${id}`);
    return data;
  }
}
const SportsInfoService = new ApiService();
export default SportsInfoService;
