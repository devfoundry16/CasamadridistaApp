import fetchWithAuth from './fetchWithAuth';

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
  flag?: string;
  height: string;
  weight: string;
  number: number;
  position: string;
  photo: string;
}

export interface Coach extends Player {
  career: [
    {
      team: {
        id: number;
        name: string;
        logo: string;
      };
      start: string;
      end: string;
    }
  ];
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

class ApiService {
  private API_KEY = '2efab6a210831868664529f16d897809';

  async fetchTeamInfo(name: string): Promise<TeamInfo> {
    const param: Record<string, string> = {
      name: name,
    };
    const res = await fetchWithAuth('teams/', this.API_KEY, param);
    const flag = await this.fetchCountryFlag(res.response[0].team.country);
    return {
      ...res.response[0].team,
      stadium: res.response[0].venue.name,
      flag,
    };
  }
  async fetchSquad(id: number | undefined) {
    const param: Record<string, number | undefined> = {
      team: id,
    };
    const res = await fetchWithAuth('players/squads', this.API_KEY, param);
    return res.response[0].players.slice();
  }
  async fetchProfile(id: number) {
    const param: Record<string, number> = {
      player: id,
    };
    const res = await fetchWithAuth('players/profiles/', this.API_KEY, param);
    return res.response[0].player;
  }
  async fetchCoachProfile(id: number) {
    //team id
    const param: Record<string, number> = {
      team: id,
    };
    const res = await fetchWithAuth('coachs/', this.API_KEY, param);
    return res.response[0];
  }
  async fetchCountryFlag(country: string) {
    const param: Record<string, string> = {
      name:
        country.toLowerCase() == 'türkiye' ? 'turkey' : country.toLowerCase(),
    };
    const res = await fetchWithAuth('countries/', this.API_KEY, param);
    return res.response[0]?.flag;
  }
}

export const ProfileApiService = new ApiService();
