export interface Competition {
  id: number;
  name: string;
  /** "League" for domestic leagues, "Cup" for everything else. */
  type: string;
  logo: string;
  country: string | null;
  flag: string | null;
  /**
   * Seasons worth offering in the picker, newest first.
   *
   * A competition only reaches the client at all when at least one of its
   * recent seasons carries the API's `coverage.standings` flag, which is what
   * keeps knockout cups out. Within a competition that qualifies, the CURRENT
   * season is always listed even before its table publishes — so this is not a
   * promise that every year here has rows, and the screen has an empty state
   * for the year that doesn't yet.
   */
  seasons: number[];
}

export interface CompetitionCatalog {
  currentSeason: number;
  competitions: Competition[];
}
