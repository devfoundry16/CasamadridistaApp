import fetchWithAuth from "./fetchWithAuth";
import { TeamInfo } from "@/interfaces/profile";
class ApiService {
  private API_KEY = "2efab6a210831868664529f16d897809";

  async fetchTeamsInLeague(
    leagueId: number,
    season: number
  ): Promise<TeamInfo[]> {
    const param: Record<string, number> = {
      league: leagueId,
      season: season,
    };
    const res = await fetchWithAuth("teams", this.API_KEY, param);
    return res.response;
  }

  async fetchTeamInfo(id: number): Promise<TeamInfo> {
    const param: Record<string, number> = {
      id: id,
    };
    const res = await fetchWithAuth("teams/", this.API_KEY, param);
    const flag = await this.fetchCountryFlag(res.response[0].team.country);
    return {
      ...res.response[0],
      flag,
    };
  }
  async fetchSquad(id: number | undefined) {
    const param: Record<string, number | undefined> = {
      team: id,
    };
    const res = await fetchWithAuth("players/squads", this.API_KEY, param);
    return res.response[0].players.slice();
  }
  async fetchProfile(id: number) {
    const param: Record<string, number> = {
      player: id,
    };
    const res = await fetchWithAuth("players/profiles/", this.API_KEY, param);
    console.log('player:', id)
    if (res.response[0] == undefined) console.log('error player: ', id, res)
    return res.response[0].player;
  }
  async fetchCoachProfile(id: number) {
    //team id
    const param: Record<string, number> = {
      team: id,
    };
    const res = await fetchWithAuth("coachs/", this.API_KEY, param);
    return res.response[0];
  }
  async fetchCountryFlag(country: string) {
    const param: Record<string, string> = {
      name:
        country.toLowerCase() == "türkiye" ? "turkey" : country.toLowerCase(),
    };
    const res = await fetchWithAuth("countries/", this.API_KEY, param);
    return res.response[0]?.flag;
  }
}
const ProfileApiService = new ApiService();
export default ProfileApiService;
