import { useQuery } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ErrorState from '@/components/Team/ErrorState';
import SectionHeading from '@/components/Team/SectionHeading';
import { Text } from '@/components/Text';
import Colors from '@/constants/colors';
import PostService from '@/services/PostService';
import { barHeights, type PostInsights } from '@/utils/postInsights.core';
import { isUuid } from '@/utils/pushPayload.core';

const CHART_HEIGHT = 72;

/**
 * Your own post's Insights, from its "..." menu: views (one per person per
 * day, from the day this was released), people reached, opens, likes,
 * comments, saves and shares by channel, and views over the last 30 days.
 * Someone else's post answers 404, which reads as an error here.
 */
export default function PostInsightsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const validId = isUuid(id);

  const query = useQuery({
    queryKey: ['post', id, 'insights'],
    queryFn: () => PostService.getInsights(id),
    enabled: validId,
    staleTime: 60_000,
  });

  if (!validId) return <Redirect href="/" />;
  if (query.isPending) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background.dark }}>
        <ActivityIndicator color={Colors.darkGold} />
      </View>
    );
  }
  if (query.isError || !query.data) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background.dark }}>
        <ErrorState title={t('community.insights.loadFailed')} onRetry={() => query.refetch()} />
      </View>
    );
  }
  return <InsightsBody data={query.data} />;
}

function InsightsBody({ data }: { data: PostInsights }) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { totals, channels, series, trackedSince } = data;
  const heights = barHeights(series, CHART_HEIGHT);
  const since = trackedSince
    ? new Date(`${trackedSince}T00:00:00Z`).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background.dark }}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24 }}
    >
      <View className="px-4">
        <SectionHeading title={t('community.insights.reach')} />
        <View className="flex-row flex-wrap">
          <Metric label={t('community.insights.views')} value={totals.views} />
          <Metric label={t('community.insights.people')} value={totals.unique_viewers} />
          <Metric label={t('community.insights.opens')} value={totals.opens} />
        </View>
        {since ? (
          <Text className="text-[11px] mt-1" style={{ color: Colors.text.muted }}>
            {t('community.insights.trackedSince', { date: since })}
          </Text>
        ) : null}
      </View>

      <View className="px-4 pt-5">
        <SectionHeading title={t('community.insights.last30')} />
        <View
          accessible
          accessibilityLabel={t('community.insights.chartLabel', { count: series.reduce((a, d) => a + d.views, 0) })}
          style={{ height: CHART_HEIGHT, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}
        >
          {heights.map((h, i) => (
            <View
              key={series[i].day}
              style={{ flex: 1, height: Math.max(h, 1), borderRadius: 2, backgroundColor: h ? Colors.darkGold : Colors.border.default }}
            />
          ))}
        </View>
      </View>

      <View className="px-4 pt-5">
        <SectionHeading title={t('community.insights.engagement')} />
        <View className="flex-row flex-wrap">
          <Metric label={t('community.insights.likes')} value={totals.likes} />
          <Metric label={t('community.insights.comments')} value={totals.comments} />
          <Metric label={t('community.insights.saves')} value={totals.saves} />
          <Metric label={t('community.insights.shares')} value={totals.shares} />
        </View>
      </View>

      <View className="px-4 pt-5">
        <SectionHeading title={t('community.insights.sharesBy')} />
        {channels.map(({ channel, count }) => (
          <View key={channel} className="flex-row items-center justify-between py-2">
            <Text className="text-[14px]" style={{ color: Colors.text.secondary }}>
              {t(`community.insights.channel.${channel}`)}
            </Text>
            <Text className="text-[14px] font-bold" style={{ color: Colors.text.primary, writingDirection: 'ltr' }}>
              {String(count)}
            </Text>
          </View>
        ))}
      </View>

      <Text className="text-[11px] px-4 pt-5" style={{ color: Colors.text.muted }}>
        {t('community.insights.ownViews')}
      </Text>
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ width: '33.333%', paddingVertical: 10, paddingEnd: 8 }}>
      {/* Digit runs are pinned LTR: an Arabic UI otherwise reverses "1,204". */}
      <Text className="text-[18px] font-bold" style={{ color: Colors.text.primary, writingDirection: 'ltr' }}>
        {String(value)}
      </Text>
      <Text className="text-[11px] mt-0.5" style={{ color: Colors.text.tertiary }}>
        {label}
      </Text>
    </View>
  );
}
