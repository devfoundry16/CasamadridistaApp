import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import MediaGridList from '@/components/Media/MediaGridList';
import MediaSearchBar from '@/components/Media/Search/MediaSearchBar';
import Colors from '@/constants/colors';
import { useMediaSearch } from '@/hooks/media/useMediaSearch';
import AnalyticsService from '@/services/AnalyticsService';

/** Full-text search across published media. */
export default function MediaSearchScreen() {
  const { t } = useTranslation();
  const [text, setText] = useState('');

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
  } = useMediaSearch(text);

  // One event per settled query string, not per keystroke — `query` is already
  // the debounced value.
  useEffect(() => {
    if (!enabled) return;
    AnalyticsService.track('search', { props: { q: query } });
  }, [enabled, query]);

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>
      <MediaSearchBar value={text} onChangeText={setText} />
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
  );
}
