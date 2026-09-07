import { useEffect, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import CasaMediaService, { type MediaSearchQuery } from '@/services/CasaMediaService';
import { mediaKeys } from './keys';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

/** Debounce here rather than in the screen so every caller gets the same delay. */
export function useDebouncedValue<T>(value: T, delay = DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * Full-text search across published media.
 *
 * Disabled below two characters: a one-letter `websearch_to_tsquery` matches
 * effectively everything and is pure server load for a result nobody wants.
 */
export function useMediaSearch(rawQuery: string, filters: MediaSearchQuery = {}) {
  const query = useDebouncedValue(rawQuery.trim());
  const enabled = query.length >= MIN_QUERY_LENGTH;

  const result = useInfiniteQuery({
    // The filters are part of the key: without them, narrowing a search would
    // serve the unfiltered results straight back out of the cache.
    queryKey: mediaKeys.search(query, filters),
    queryFn: ({ pageParam }) => CasaMediaService.search(query, pageParam ?? null, filters),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
    staleTime: 60_000,
  });

  return { ...result, query, enabled, minLength: MIN_QUERY_LENGTH };
}

/**
 * The option lists behind the filter row.
 *
 * Long-lived: these change when content is published, not per keystroke, and
 * the backend caches the response for five minutes anyway.
 */
export function useSearchFilterOptions() {
  return useQuery({
    queryKey: mediaKeys.searchFilters(),
    queryFn: () => CasaMediaService.getSearchFilters(),
    staleTime: 30 * 60_000,
  });
}
