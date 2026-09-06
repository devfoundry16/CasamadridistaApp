import { useMediaHome } from './useHome';

/**
 * Is there a fixture close enough that Casa Media should be surfaced early?
 *
 * **This is a window, not a whistle.** The backend sets `home.live_match` from
 * `matchService.currentMatch()`, which returns a fixture within **±24h of
 * kickoff**, preferring one that is actually in play. So this is true for most
 * of the day before a match and most of the day after it — read it as "match
 * day", not "kicking off right now". The name is deliberately `MatchWindow`
 * rather than `LiveMatch` for that reason.
 *
 * If a caller ever needs the narrow signal — the ball is actually moving —
 * `isLiveStatus(status_short)` in `components/Media/Match/MatchIdentityStrip`
 * is that test, and `live_match.status_short` carries the input for it.
 *
 * Free to call: this reads the same React Query key as every other
 * `useMediaHome()` consumer (`mediaKeys.home()`), so it is a cache read rather
 * than a second request.
 */
export function useIsMatchWindow(): boolean {
  const { data } = useMediaHome();
  return !!data?.live_match;
}
