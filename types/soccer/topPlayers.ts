export interface TopPlayerProfile {
  id: number;
  name: string;
  firstname: string | null;
  lastname: string | null;
  age: number;
  birth: { date: string | null; place: string | null; country: string | null };
  nationality: string;
  height: string | null;
  weight: string | null;
  injured: boolean;
  photo: string;
}

export interface TopPlayerStatLine {
  team: { id: number; name: string; logo: string };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
  };
  games: {
    /** API-Football's own misspelling — kept so the type matches the wire. */
    appearences: number | null;
    lineups: number | null;
    minutes: number | null;
    number: number | null;
    position: string;
    /** e.g. "7.833333" */
    rating: string | null;
    captain: boolean;
  };
  goals: {
    total: number | null;
    conceded: number | null;
    assists: number | null;
    saves: number | null;
  };
  cards: { yellow: number | null; yellowred: number | null; red: number | null };
}

export interface TopPlayerEntry {
  player: TopPlayerProfile;
  /** One entry per team the player turned out for this season. */
  statistics: TopPlayerStatLine[];
}
