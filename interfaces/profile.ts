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
