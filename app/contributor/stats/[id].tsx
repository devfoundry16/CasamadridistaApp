import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ContributorGate from '@/components/Contributor/ContributorGate';
import SectionHeading from '@/components/Team/SectionHeading';
import ErrorState from '@/components/Team/ErrorState';
import { Text } from '@/components/Text';
import Colors from '@/constants/colors';
import { useItemStats } from '@/hooks/media/useContributor';

export default function ItemStatsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = typeof id === 'string' ? id : undefined;

  return (
    <ContributorGate returnTo={`/contributor/stats/${itemId ?? ''}`}>
      {() => <ItemStats itemId={itemId} />}
    </ContributorGate>
  );
}

/**
 * One item's numbers.
 *
 * Two blocks on purpose: `live` are the counters on `media_items`, accurate to
 * the last Redis flush, while `totals` come from the nightly `media_daily_stats`
 * rollup. They will not agree on the day an item is published, and presenting
 * them as one number would make the discrepancy look like a bug.
 */
function ItemStats({ itemId }: { itemId: string | undefined }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const query = useItemStats(itemId);

  if (query.isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: Colors.background.dark }}
      >
        <ActivityIndicator color={Colors.darkGold} />
      </View>
    );
  }

  if (query.isError || !query.data) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.background.dark }}>
        <ErrorState
          title={(query.error as Error)?.message ?? t('contributor.stats.loadFailed')}
          onRetry={() => query.refetch()}
        />
      </View>
    );
  }

  const { live, totals, range } = query.data;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background.dark }}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24 }}
    >
      {live ? (
        <View className="px-4">
          <SectionHeading title={t('contributor.stats.liveTitle')} />
          <View className="flex-row flex-wrap">
            <Metric label={t('contributor.stats.views')} value={live.views} />
            <Metric label={t('contributor.stats.likes')} value={live.likes} />
            <Metric label={t('contributor.stats.comments')} value={live.comments} />
            <Metric label={t('contributor.stats.shares')} value={live.shares} />
            <Metric label={t('contributor.stats.saves')} value={live.saves} />
            <Metric label={t('contributor.stats.storyViews')} value={live.story_views} />
          </View>
        </View>
      ) : null}

      <View className="px-4 pt-5">
        <SectionHeading title={t('contributor.stats.rollupTitle')} />
        <Text className="text-[11px] mb-2" style={{ color: Colors.text.muted, writingDirection: 'ltr' }}>
          {`${range?.from ?? ''} → ${range?.to ?? ''}`}
        </Text>
        <View className="flex-row flex-wrap">
          <Metric label={t('contributor.stats.impressions')} value={totals.impressions ?? 0} />
          <Metric label={t('contributor.stats.views')} value={totals.views ?? 0} />
          <Metric label={t('contributor.stats.uniqueViewers')} value={totals.unique_viewers ?? 0} />
          <Metric label={t('contributor.stats.lockedViews')} value={totals.locked_views ?? 0} />
          <Metric label={t('contributor.stats.ctaClicks')} value={totals.cta_clicks ?? 0} />
          <Metric label={t('contributor.stats.signups')} value={totals.signups_attributed ?? 0} />
          <Metric label={t('contributor.stats.videoStarts')} value={totals.video_starts ?? 0} />
          <Metric label={t('contributor.stats.videoCompletes')} value={totals.video_completes ?? 0} />
          <Metric label={t('contributor.stats.pushOpens')} value={totals.push_opens ?? 0} />
        </View>
      </View>
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ width: '33.333%', paddingVertical: 10, paddingEnd: 8 }}>
      {/* Digit runs are pinned LTR: an Arabic UI otherwise reverses "1,204". */}
      <Text
        className="text-[18px] font-bold"
        style={{ color: Colors.text.primary, writingDirection: 'ltr' }}
      >
        {String(value ?? 0)}
      </Text>
      <Text className="text-[11px] mt-0.5" style={{ color: Colors.text.tertiary }}>
        {label}
      </Text>
    </View>
  );
}
