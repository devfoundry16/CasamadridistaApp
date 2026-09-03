import { useRouter } from 'expo-router';
import { ListVideo } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ContributorGate from '@/components/Contributor/ContributorGate';
import MyContentRow from '@/components/Contributor/MyContentRow';
import Chip from '@/components/Team/Chip';
import EmptyState from '@/components/Team/EmptyState';
import ErrorState from '@/components/Team/ErrorState';
import Colors from '@/constants/colors';
import { useMyContent } from '@/hooks/media/useMyContent';
import type { ContributorItem } from '@/types/media/contributor';

/** The statuses worth filtering by; `all` is the leading pseudo-filter. */
const FILTERS = ['all', 'draft', 'pending_review', 'scheduled', 'published', 'rejected'] as const;

type Filter = (typeof FILTERS)[number];

const ROW_HEIGHT = 96;

export default function MyContentScreen() {
  return <ContributorGate returnTo="/contributor/my-content">{() => <MyContent />}</ContributorGate>;
}

function MyContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');

  const query = useMyContent({
    status: filter === 'all' ? undefined : filter,
    limit: 50,
  });

  const items = query.data?.data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.dark }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 10 }}
        style={{ flexGrow: 0 }}
      >
        {FILTERS.map((value) => (
          <Chip
            key={value}
            label={
              value === 'all'
                ? t('contributor.myContent.filterAll')
                : t(`contributor.status.${value}`)
            }
            active={filter === value}
            onPress={() => setFilter(value)}
          />
        ))}
      </ScrollView>

      {query.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Colors.darkGold} />
        </View>
      ) : query.isError ? (
        <ErrorState
          title={(query.error as Error)?.message ?? t('contributor.myContent.loadFailed')}
          onRetry={() => query.refetch()}
        />
      ) : (
        <FlatList<ContributorItem>
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MyContentRow
              item={item}
              onPress={() =>
                router.push({ pathname: '/contributor/create', params: { id: item.id } })
              }
              onStats={() => router.push(`/contributor/stats/${item.id}`)}
            />
          )}
          // Every row is a fixed 96pt, so the list can skip measurement.
          getItemLayout={(_data, index) => ({
            length: ROW_HEIGHT,
            offset: ROW_HEIGHT * index,
            index,
          })}
          windowSize={5}
          removeClippedSubviews
          contentContainerStyle={{ paddingBottom: insets.bottom + 24, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={Colors.darkGold}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={ListVideo}
              title={t('contributor.myContent.emptyTitle')}
              body={t('contributor.myContent.emptyBody')}
              action={{
                label: t('contributor.home.quickPost'),
                onPress: () => router.push('/contributor/quick-post'),
              }}
            />
          }
        />
      )}
    </View>
  );
}
