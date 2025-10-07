export interface Match {
  fixture: {
    id: number;
    referee: number;
    timezone: string;
    date: Date;
    timestamp: number;
    periods: {
      first: Number;
      second: Number;
    };
    venue: {
      id: number;
      name: string;
      city: string;
    };
    status: {
      long: string;
      short: string;
      elapsed: number;
      extra: number;
    };
  };
  league: {
    id: 140;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: 2025;
    round: string; //"Regular Season - 8";
    standings: true;
  };
  teams: {
    home: {
      id: number; //541;
      name: string; //"Real Madrid";
      logo: string; //"https://media.api-sports.io/football/teams/541.png";
      winner: string;
    };
    away: {
      id: number;
      name: string;//"Villarreal";
      logo: string;//"https://media.api-sports.io/football/teams/533.png";
      winner: string;
    };
  };
  goals: {
    home: number;
    away: number;
  };
  score: {
    halftime: {
      home: number;
      away: number;
    };
    fulltime: {
      home: number;
      away: number;
    };
    extratime: {
      home: number;
      away: number;
    };
    penalty: {
      home: number;
      away: number;
    };
  };
}