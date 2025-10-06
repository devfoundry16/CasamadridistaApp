import { Match } from "./match";

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
  };
  nationality: string;
  height: string;
  weight: string;
  number: number;
  position: string;
  photo: string;
}

export interface PlayerWithTeam {
  team: {
    id: number;
  };
  player: Player[];
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
export interface CoachWithTeam {
  team: {
    id: number;
  };
  player: Coach;
}

export interface TeamInfo {
  team: {
    id: number; //529;
    name: string; //"Barcelona";
    code: string; //"BAR";
    country: string; //"Spain";
    founded: number; //1899;
    national: boolean//false;
    logo: string;//"https://media.api-sports.io/football/teams/529.png";
  };
  venue: {
    id: number;//19939;
    name: string;//"Estadi Olímpic Lluís Companys";
    address: string; //"Carrer de l&apos;Estadi";
    city: string; //"Barcelona";
    capacity: number; //55926;
    surface: string; //"grass";
    image: string; //"https://media.api-sports.io/football/venues/19939.png";
  };
  nextMatches: Match[];
  lastMatches: Match[];
}
export type CountryMap = { [countryName: string]: string };