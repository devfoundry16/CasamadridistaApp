const BASE_API_URL = "https://v3.football.api-sports.io/";
export interface Player {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: number;
  birth: {
    date: string;
    place: string;
    country: string;
    flag: string;
  };
  nationality: string;
  height: string;
  weight: string;
  number: number;
  position: string;
  photo: string;
}

export interface TeamInfo {
  id: number;
  name: string;
  code: string;
  country: string;
  flag: string;
  stadium: string;
  founded: number;
  logo: string;
}

type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>
  | Record<string, any>;
class SportsApiService {
  private API_KEY = "2efab6a210831868664529f16d897809";

  async fetchWithAuth(
    endpoint: string,
    apiKey: string,
    params?: Record<string, QueryValue>
  ): Promise<any> {
    // build URL using the base + endpoint so we handle existing query strings correctly
    const url = new URL(endpoint, BASE_API_URL);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return; // skip empty

        if (Array.isArray(value)) {
          // append multiple entries for array values
          value.forEach((v) => url.searchParams.append(key, String(v)));
        } else if (typeof value === "object") {
          // for objects, stringify
          url.searchParams.append(key, JSON.stringify(value));
        } else {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        "x-rapidapi-key": apiKey,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      // try to include body text for easier debugging
      const text = await response.text().catch(() => "");
      throw new Error(
        `API error: ${response.status} ${response.statusText} ${text}`
      );
    }

    return response.json();
  }
  async fetchTeamInfo(name: string): Promise<TeamInfo> {
    const param: Record<string, string> = {
      name: name,
    };
    const res = await this.fetchWithAuth("teams/", this.API_KEY, param);
    const flag = await this.fetchCountryFlag(res.response[0].team.country);
    return { ...res.response[0].team, stadium: res.response[0].venue.name, flag};
  }
  async fetchSquad(id: number | undefined) {
    const param: Record<string, number | undefined> = {
      team: id,
    };
    const res = await this.fetchWithAuth("players/squads", this.API_KEY, param);
    return res.response[0].players.slice();
  }
  async fetchProfile(id: number) {
    const param: Record<string, number> = {
      player: id,
    };
    const res = await this.fetchWithAuth(
      "players/profiles/",
      this.API_KEY,
      param
    );
    return res.response[0].player;
  }
  async fetchCountryFlag(country: string) {
    const param: Record<string, string> = {
      name:
        country.toLowerCase() == "türkiye" ? "turkey" : country.toLowerCase(),
    };
    const API_KEY = "2efab6a210831868664529f16d897809";
    const res = await this.fetchWithAuth("countries/", this.API_KEY, param);
    return res.response[0]?.flag;
  }
}

export const SportsService = new SportsApiService();
