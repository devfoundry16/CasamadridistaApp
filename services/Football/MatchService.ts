// class ApiService {
//   private API_KEY = "2efab6a210831868664529f16d897809";
//   async fetchNextMatch(teamId: number) {
//     const param: Record<string, any> = {
//       team: teamId,
//       next: 1,
//     };
//     const res = await fetchWithAuth("fixtures", this.API_KEY, param);
//     return res.response[0]; // Returns the next match object
//   }
//   async fetchLiveMatch(teamId: number) {
//     const param: Record<string, any> = {
//       team: teamId,
//       live: "all",
//     };
//     const res = await fetchWithAuth("fixtures", this.API_KEY, param);
//     return res.response[0]; // Returns the next match object
//   }

//   async fetchUpcomingMatches(teamId: number, count: number = 5) {
//     const param: Record<string, any> = {
//       team: teamId,
//       next: count,
//     };
//     const res = await fetchWithAuth("fixtures", this.API_KEY, param);
//     return res.response; // Array of match objects
//   }
//   async fetchLastMatches(teamId: number, count: number = 5) {
//     const param: Record<string, any> = {
//       team: teamId,
//       last: count,
//     };
//     const res = await fetchWithAuth("fixtures", this.API_KEY, param);
//     return res.response; // Array of match objects
//   }
// }
// const MatchService = new ApiService();
// export default MatchService;
import axios, { AxiosInstance } from "axios";
import { MATCH_BASE_API_URL } from "@env";
class ApiService {
  private api: AxiosInstance;
  constructor() {
    this.api = axios.create({
      baseURL: MATCH_BASE_API_URL,
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
