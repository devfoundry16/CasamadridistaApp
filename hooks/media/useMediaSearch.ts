import { useEffect, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import CasaMediaService, { type MediaSearchQuery } from '@/services/CasaMediaService';
import { MIN_QUERY_LENGTH, canSearch } from '@/utils/mediaSearch.core';
import { mediaKeys } from './keys';

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
 * Search across published media: by keyword, by the filter row alone, or both.
 *
 * `canSearch` decides when it runs — a keyword of two characters or more, or
 * no keyword and at least one filter.
 */
export function useMediaSearch(rawQuery: string, filters: MediaSearchQuery = {}) {
  const query = useDebouncedValue(rawQuery.trim());
  const enabled = canSearch(query, filters as Record<string, unknown>);

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
