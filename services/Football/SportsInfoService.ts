// import { TeamInfo } from "@/types/soccer/profile";
// import fetchWithAuth from "./footballApi";
// class ApiService {
//   private API_KEY = "2efab6a210831868664529f16d897809";

// async fetchTeamsInLeague(
//   leagueId: number,
//   season: number
// ): Promise<TeamInfo[]> {
//   const param: Record<string, number> = {
//     league: leagueId,
//     season: season,
//   };
//   const res = await fetchWithAuth("teams", this.API_KEY, param);
//   return res.response;
// }

// async fetchLeagueById(leagueId: number) {
//   const param: Record<string, number> = {
//     id: leagueId,
//   };
//   const res = await fetchWithAuth("leagues", this.API_KEY, param);
//   return res.response[0];
// }

// async fetchTeamInfo(id: number): Promise<TeamInfo> {
//   const param: Record<string, number> = {
//     id: id,
//   };
//   const res = await fetchWithAuth("teams/", this.API_KEY, param);
//   const flag = await this.fetchCountryFlag(res.response[0].team.country);
//   return {
//     ...res.response[0],
//     flag,
//   };
// }
// async fetchSquad(id: number | undefined) {
//   const param: Record<string, number | undefined> = {
//     team: id,
//   };
//   const res = await fetchWithAuth("players/squads", this.API_KEY, param);
//   return res.response[0];
// }
// async fetchProfile(id: number) {
//   const param: Record<string, number> = {
//     player: id,
//   };
//   const res = await fetchWithAuth("players/profiles/", this.API_KEY, param);
//   if (res.response[0] == undefined) console.log("error player: ", id, res);
//   return res.response[0].player;
// }
// async fetchCoachProfile(id: number) {
//   //team id
//   const param: Record<string, number> = {
//     team: id,
//   };
//   const res = await fetchWithAuth("coachs/", this.API_KEY, param);
//   return res.response[0];
// }
// async fetchCountryFlag(country: string) {
//   const param: Record<string, string> = {
//     name:
//       country.toLowerCase() === "türkiye" ? "turkey" : country.toLowerCase(),
//   };
//   const res = await fetchWithAuth("countries/", this.API_KEY, param);
//   return res.response[0]?.flag;
// }
// async fetchVenueById(id: number) {
//   const param: Record<string, number> = {
//     id: id,
//   };
//   const res = await fetchWithAuth("venues/", this.API_KEY, param);
//   return res.response[0];
// }
//}
import axios, { AxiosInstance } from "axios";
class ApiService {
  private api: AxiosInstance;
  constructor() {
    this.api = axios.create({
      baseURL: "http://localhost:3000/api/profile",
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
