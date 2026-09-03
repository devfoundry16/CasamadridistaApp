import { Library } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';

import ArchiveFilters, { type ArchiveFilterValue } from '@/components/Media/Archive/ArchiveFilters';
import ArchiveMatchCard from '@/components/Media/Archive/ArchiveMatchCard';
import EmptyState from '@/components/Team/EmptyState';
import ErrorState from '@/components/Team/ErrorState';
import Colors from '@/constants/colors';
import { useArchive, useArchiveFilters } from '@/hooks/media/useArchive';

/** Match-by-match archive with season / competition / opponent filters. */
export default function MediaArchiveScreen() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<ArchiveFilterValue>({});

  const { data: filterOptions } = useArchiveFilters();
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useArchive(filters);

  const entries = data?.pages.flatMap((page) => page.matches) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>
      <ArchiveFilters filters={filterOptions} value={filters} onChange={setFilters} />

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.darkGold} />
        </View>
      ) : isError ? (
        <ErrorState title={t('casaMedia.loadFailed')} onRetry={refetch} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(entry) => String(entry.match.id)}
          renderItem={({ item }) => <ArchiveMatchCard entry={item} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, flexGrow: 1 }}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.6}
          windowSize={5}
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.darkGold}
              colors={[Colors.darkGold]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={Library}
              title={t('casaMedia.archiveEmptyTitle')}
              body={t('casaMedia.archiveEmptyBody')}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <ActivityIndicator color={Colors.darkGold} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
