export interface StandingSplit {
  played: number;
  win: number;
  draw: number;
  lose: number;
  goals: { for: number; against: number };
}

export interface StandingRow {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  /** "La Liga" | "Group A" | "League Phase" */
  group: string;
  /** "WWDLW" — most recent LAST. */
  form: string | null;
  status: "same" | "up" | "down" | string;
  /** e.g. "Promotion - Champions League (League phase)" */
  description: string | null;
  all: StandingSplit;
  home: StandingSplit;
  away: StandingSplit;
  update: string;
}

export interface LeagueStandings {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    /** One inner array per group. La Liga is a single group: [[...20 rows]]. */
    standings: StandingRow[][];
  };
}
