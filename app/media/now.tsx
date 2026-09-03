import { useLocalSearchParams } from 'expo-router';
import { Clapperboard } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';

import MatchIdentityStrip from '@/components/Media/Match/MatchIdentityStrip';
import TimelineRow from '@/components/Media/TimelineRow';
import EmptyState from '@/components/Team/EmptyState';
import ErrorState from '@/components/Team/ErrorState';
import Colors from '@/constants/colors';
import { useTimeline } from '@/hooks/media/useTimeline';
import type { MediaItem } from '@/types/media/casaMedia';

/**
 * "From Madrid Now" in full — the live drop feed for one fixture.
 *
 * The poll interval lives in `useTimeline` and stops itself once the server
 * reports the match is no longer live.
 */
export default function FromMadridNowScreen() {
  const { t } = useTranslation();
  const { matchId } = useLocalSearchParams<{ matchId?: string }>();
  const parsedId = Number.parseInt(matchId ?? '', 10);

  const { data, isLoading, isError, refetch, isRefetching } = useTimeline(
    Number.isFinite(parsedId) ? parsedId : undefined,
  );

  if (isLoading) {
    return (
      <View style={centered}>
        <ActivityIndicator size="large" color={Colors.darkGold} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={centered}>
        <ErrorState title={t('casaMedia.loadFailed')} onRetry={refetch} />
      </View>
    );
  }

  const items: MediaItem[] = data?.items ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>
      <MatchIdentityStrip match={data?.match} fallbackTitle={t('casaMedia.fromMadridNow')} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TimelineRow item={item} isLast={index === items.length - 1} />
        )}
        contentContainerStyle={{ paddingTop: 14, paddingBottom: 40, flexGrow: 1 }}
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
            icon={Clapperboard}
            title={t('casaMedia.timelineEmptyTitle')}
            body={t('casaMedia.timelineEmptyBody')}
          />
        }
      />
    </View>
  );
}

const centered = {
  flex: 1,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  backgroundColor: Colors.background.deepDark,
};
