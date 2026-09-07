import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import MediaGridList from '@/components/Media/MediaGridList';
import MediaSearchBar from '@/components/Media/Search/MediaSearchBar';
import SearchFilters from '@/components/Media/Search/SearchFilters';
import Colors from '@/constants/colors';
import { useMediaSearch, useSearchFilterOptions } from '@/hooks/media/useMediaSearch';
import AnalyticsService from '@/services/AnalyticsService';
import { MediaSurfaceProvider } from '@/components/Media/MediaSurfaceContext';
import type { MediaSearchQuery } from '@/services/CasaMediaService';

/** Full-text search across published media. */
export default function MediaSearchScreen() {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [filters, setFilters] = useState<MediaSearchQuery>({});
  const { data: filterOptions } = useSearchFilterOptions();

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    query,
    enabled,
    minLength,
  } = useMediaSearch(text, filters);

  // One event per settled query string, not per keystroke — `query` is already
  // the debounced value.
  useEffect(() => {
    if (!enabled) return;
    // The filters ride on the event: "what did people search for" and "what did
    // they narrow it to" are different questions, and only one was answerable.
    AnalyticsService.track('search', {
      surface: 'search',
      props: { q: query, ...(filters as Record<string, string | number>) },
    });
  }, [enabled, query, filters]);

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <MediaSurfaceProvider surface="search">
      <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>
        <MediaSearchBar value={text} onChangeText={setText} />
        <SearchFilters options={filterOptions} value={filters} onChange={setFilters} />
        <MediaGridList
          items={enabled ? items : []}
          isLoading={enabled && isLoading}
          isError={isError}
          errorTitle={t('casaMedia.loadFailed')}
          onRetry={refetch}
          emptyTitle={
            enabled ? t('casaMedia.searchNoResults') : t('casaMedia.searchPrompt', { value: minLength })
          }
          emptyBody={enabled ? t('casaMedia.searchNoResultsBody') : undefined}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          isFetchingNextPage={isFetchingNextPage}
        />
      </View>
    </MediaSurfaceProvider>
  );
}
