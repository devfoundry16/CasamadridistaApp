export interface SplitTotals {
  home: number;
  away: number;
  total: number;
}

export interface MinuteBucket {
  total: number | null;
  percentage: string | null;
}

export type MinuteKey =
  | "0-15"
  | "16-30"
  | "31-45"
  | "46-60"
  | "61-75"
  | "76-90"
  | "91-105"
  | "106-120";

export type MinuteBuckets = Record<MinuteKey, MinuteBucket>;

export interface GoalSide {
  total: SplitTotals;
  /** API returns these as strings, e.g. "2.0". */
  average: { home: string; away: string; total: string };
  minute: MinuteBuckets;
}

export interface TeamStatistics {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
  };
  team: { id: number; name: string; logo: string };
  form: string | null;
  fixtures: {
    played: SplitTotals;
    wins: SplitTotals;
    draws: SplitTotals;
    /** API spelling. */
    loses: SplitTotals;
  };
  goals: { for: GoalSide; against: GoalSide };
  clean_sheet: SplitTotals;
  failed_to_score: SplitTotals;
  penalty: {
    /** `percentage` is a string like "80.00%" and can be null. */
    scored: { total: number; percentage: string | null };
    missed: { total: number; percentage: string | null };
    total: number;
  };
  lineups: { formation: string; played: number }[];
  cards: { yellow: MinuteBuckets; red: MinuteBuckets };
}
