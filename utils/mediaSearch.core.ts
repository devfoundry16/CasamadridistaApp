/**
 * The pure half of Casa Media search (`hooks/media/useMediaSearch.ts`).
 *
 * Zero imports, so `utils/__tests__/mediaSearch.test.mts` runs it under
 * `node --test`.
 */

/** Below this a keyword is not sent: a one-letter `websearch_to_tsquery`
 *  matches effectively everything and is pure server load. */
export const MIN_QUERY_LENGTH = 2;

/** Whether at least one filter is set. A pill left at "All" holds `undefined`. */
export function hasFilter(filters: Record<string, unknown>): boolean {
  return Object.values(filters).some((value) => value !== undefined && value !== null && value !== '');
}

/**
 * Should the search run?
 *
 * A keyword long enough to mean something, or — with no keyword at all — at
 * least one filter (§22: search by match, opponent, competition, date,
 * contributor or type). A keyword that is too short blocks the search even
 * with filters set, so half-typed text never sends a query of its own.
 */
export function canSearch(query: string, filters: Record<string, unknown>): boolean {
  if (query.length >= MIN_QUERY_LENGTH) return true;
  return query.length === 0 && hasFilter(filters);
}
