import { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import CasaMediaService from '@/services/CasaMediaService';
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
export function useMediaSearch(rawQuery: string) {
  const query = useDebouncedValue(rawQuery.trim());
  const enabled = query.length >= MIN_QUERY_LENGTH;

  const result = useInfiniteQuery({
    queryKey: mediaKeys.search(query),
    queryFn: ({ pageParam }) => CasaMediaService.search(query, pageParam ?? null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
    staleTime: 60_000,
  });

  return { ...result, query, enabled, minLength: MIN_QUERY_LENGTH };
}
