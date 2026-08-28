/**
 * The single source of truth for standings column widths.
 *
 * The header strip, the body rows and the floating pinned row all read from
 * here. If any of them hardcodes a width instead, the columns drift apart the
 * first time someone tweaks one of the three — which is exactly the failure the
 * old api-sports widget shipped with (team names overlapping the MP column).
 */
export const STANDINGS_LAYOUT = {
  /** Page gutter. Matches app/(tabs)/team/matches.tsx. */
  outerPadding: 16,
  /** Padding inside the card. Matches PlayerRow / MatchRow. */
  rowPaddingH: 14,
  /** Denser than PlayerRow's 56 — twenty rows have to scan as a table. */
  rowHeight: 48,
  railWidth: 3,
  rankWidth: 20,
  /** Established by MatchRow. */
  crestSize: 24,
  crestGap: 10,
  colPlayed: 28,
  /** Wider than the others: Arabic "الفارق" and values like "-34". */
  colDiff: 38,
  colPoints: 34,
  colGap: 4,
  pinnedHeight: 52,
} as const;

/**
 * The header strip sits on the page background, outside the cards, so it has to
 * reproduce what the rows inset by: the page gutter, SurfaceCard's 1px border,
 * the zone rail, and the row padding. Every row carries the rail — transparent
 * when there is no zone — so this holds for every band.
 */
export const STANDINGS_HEADER_INSET_START =
  STANDINGS_LAYOUT.outerPadding +
  1 +
  STANDINGS_LAYOUT.railWidth +
  STANDINGS_LAYOUT.rowPaddingH;

export const STANDINGS_HEADER_INSET_END =
  STANDINGS_LAYOUT.outerPadding + 1 + STANDINGS_LAYOUT.rowPaddingH;
