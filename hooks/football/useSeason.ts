import { useEnvironment } from "@/hooks/useEnvironment";
import { CURRENT_FOOTBALL_SEASON } from "@/constants/football";

/**
 * The API-Football season year to query.
 *
 * Prefers the backend value from /api/app-info (which is the same value the
 * backend uses server-side, so client and server never disagree), and falls
 * back to a date-derived season when app-info hasn't landed yet.
 */
export function useSeason(): number {
  const { football } = useEnvironment();
  return football?.currentSeason > 0
    ? football.currentSeason
    : CURRENT_FOOTBALL_SEASON;
}
