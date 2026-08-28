export interface Competition {
  id: number;
  name: string;
  /** "League" for domestic leagues, "Cup" for everything else. */
  type: string;
  logo: string;
  country: string | null;
  flag: string | null;
  /**
   * Seasons that have a standings table, newest first.
   *
   * The backend has already filtered these on the API's per-season
   * `coverage.standings`, so a competition only reaches the client when at
   * least one of its seasons is readable. Knockout cups never appear.
   */
  seasons: number[];
}

export interface CompetitionCatalog {
  currentSeason: number;
  competitions: Competition[];
}
