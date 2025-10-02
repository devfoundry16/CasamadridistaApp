export interface Player {
  number: number;
  photo: string;
  name: string;
  nationality: string;
  age: number;
  position: 'goalkeeper' | 'defender' | 'midfielder' | 'forward';
}

export interface Match {
  date: string;
  time: string;
  homeTeam: {
    name: string;
    logo: string;
    score: number;
  };
  awayTeam: {
    name: string;
    logo: string;
    score: number;
  };
  competition: string;
}

export const teamInfo = {
  country: 'Spain',
  founded: 1902,
  stadium: 'Santiago Bernabéu',
};

export const players: Player[] = [
  {
    number: 1,
    photo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=400&fit=crop',
    name: 'Thibaut Courtois',
    nationality: 'Belgium',
    age: 31,
    position: 'goalkeeper',
  },
  {
    number: 13,
    photo: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&h=400&fit=crop',
    name: 'Andriy Lunin',
    nationality: 'Ukraine',
    age: 24,
    position: 'goalkeeper',
  },
  {
    number: 2,
    photo: 'https://images.unsplash.com/photo-1594466168238-ab6b6c2f4d0f?w=400&h=400&fit=crop',
    name: 'Dani Carvajal',
    nationality: 'Spain',
    age: 31,
    position: 'defender',
  },
  {
    number: 3,
    photo: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=400&h=400&fit=crop',
    name: 'Éder Militão',
    nationality: 'Brazil',
    age: 25,
    position: 'defender',
  },
  {
    number: 4,
    photo: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&h=400&fit=crop',
    name: 'David Alaba',
    nationality: 'Austria',
    age: 31,
    position: 'defender',
  },
  {
    number: 22,
    photo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=400&fit=crop',
    name: 'Antonio Rüdiger',
    nationality: 'Germany',
    age: 30,
    position: 'defender',
  },
  {
    number: 23,
    photo: 'https://images.unsplash.com/photo-1564859228273-274232fdb516?w=400&h=400&fit=crop',
    name: 'Ferland Mendy',
    nationality: 'France',
    age: 28,
    position: 'defender',
  },
  {
    number: 17,
    photo: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=400&fit=crop',
    name: 'Lucas Vázquez',
    nationality: 'Spain',
    age: 32,
    position: 'defender',
  },
  {
    number: 5,
    photo: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400&h=400&fit=crop',
    name: 'Jude Bellingham',
    nationality: 'England',
    age: 20,
    position: 'midfielder',
  },
  {
    number: 8,
    photo: 'https://images.unsplash.com/photo-1557862921-37829c790f19?w=400&h=400&fit=crop',
    name: 'Toni Kroos',
    nationality: 'Germany',
    age: 34,
    position: 'midfielder',
  },
  {
    number: 10,
    photo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    name: 'Luka Modrić',
    nationality: 'Croatia',
    age: 38,
    position: 'midfielder',
  },
  {
    number: 12,
    photo: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&h=400&fit=crop',
    name: 'Eduardo Camavinga',
    nationality: 'France',
    age: 21,
    position: 'midfielder',
  },
  {
    number: 15,
    photo: 'https://images.unsplash.com/photo-1546456073-ea246a7bd25f?w=400&h=400&fit=crop',
    name: 'Federico Valverde',
    nationality: 'Uruguay',
    age: 25,
    position: 'midfielder',
  },
  {
    number: 18,
    photo: 'https://images.unsplash.com/photo-1566577134770-3d85bb3a9cc4?w=400&h=400&fit=crop',
    name: 'Aurélien Tchouaméni',
    nationality: 'France',
    age: 24,
    position: 'midfielder',
  },
  {
    number: 7,
    photo: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&h=400&fit=crop',
    name: 'Vinícius Júnior',
    nationality: 'Brazil',
    age: 23,
    position: 'forward',
  },
  {
    number: 9,
    photo: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=400&fit=crop',
    name: 'Karim Benzema',
    nationality: 'France',
    age: 36,
    position: 'forward',
  },
  {
    number: 11,
    photo: 'https://images.unsplash.com/photo-1594466168238-ab6b6c2f4d0f?w=400&h=400&fit=crop',
    name: 'Rodrygo',
    nationality: 'Brazil',
    age: 23,
    position: 'forward',
  },
  {
    number: 21,
    photo: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=400&h=400&fit=crop',
    name: 'Brahim Díaz',
    nationality: 'Spain',
    age: 24,
    position: 'forward',
  },
];

export const latestMatches: Match[] = [
  {
    date: '2024-01-28',
    time: '20:00',
    homeTeam: {
      name: 'Real Madrid',
      logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
      score: 4,
    },
    awayTeam: {
      name: 'Atlético Madrid',
      logo: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
      score: 2,
    },
    competition: 'La Liga',
  },
  {
    date: '2024-01-24',
    time: '21:00',
    homeTeam: {
      name: 'Real Madrid',
      logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
      score: 3,
    },
    awayTeam: {
      name: 'Barcelona',
      logo: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
      score: 1,
    },
    competition: 'Copa del Rey',
  },
  {
    date: '2024-01-21',
    time: '18:30',
    homeTeam: {
      name: 'Sevilla',
      logo: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg',
      score: 1,
    },
    awayTeam: {
      name: 'Real Madrid',
      logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
      score: 2,
    },
    competition: 'La Liga',
  },
  {
    date: '2024-01-17',
    time: '21:00',
    homeTeam: {
      name: 'Real Madrid',
      logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
      score: 5,
    },
    awayTeam: {
      name: 'Valencia',
      logo: 'https://upload.wikimedia.org/wikipedia/en/c/ce/Valenciacf.svg',
      score: 0,
    },
    competition: 'La Liga',
  },
  {
    date: '2024-01-14',
    time: '20:00',
    homeTeam: {
      name: 'Real Sociedad',
      logo: 'https://upload.wikimedia.org/wikipedia/en/f/f1/Real_Sociedad_logo.svg',
      score: 0,
    },
    awayTeam: {
      name: 'Real Madrid',
      logo: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
      score: 1,
    },
    competition: 'La Liga',
  },
];
