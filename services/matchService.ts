import fetchWithAuth from "./fetchWithAuth";

class ApiService {
  private API_KEY = "2efab6a210831868664529f16d897809";
  async fetchNextMatch(teamId: number) {
    const param: Record<string, any> = {
      team: teamId,
      next: 1,
    };
    const res = await fetchWithAuth("fixtures", this.API_KEY, param);
    return res.response[0]; // Returns the next match object
  }

  async fetchUpcomingMatches(
    teamId: number,
    count: number = 5
  ) {
    const param: Record<string, any> = {
      team: teamId,
      next: count,
    };
    const res = await fetchWithAuth("fixtures", this.API_KEY, param);
    return res.response; // Array of match objects
  }
  async fetchLastMatches(
    teamId: number,
    count: number = 5
  ) {
    const param: Record<string, any> = {
      team: teamId,
      last: count,
    };
    const res = await fetchWithAuth("fixtures", this.API_KEY, param);
    return res.response; // Array of match objects
  }
}
const MatchApiService = new ApiService();
export default MatchApiService;