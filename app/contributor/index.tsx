import { useRouter } from 'expo-router';
import {
  BarChart3,
  ChevronRight,
  FileEdit,
  ListVideo,
  UploadCloud,
  Zap,
} from 'lucide-react-native';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ContributorGate from '@/components/Contributor/ContributorGate';
import MyContentRow from '@/components/Contributor/MyContentRow';
import UploadProgressList from '@/components/Contributor/UploadProgressList';
import { matchDateLabel, matchLabel } from '@/components/Contributor/labels';
import SectionHeading from '@/components/Team/SectionHeading';
import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { useContributorStats } from '@/hooks/media/useContributor';
import { useMyContent } from '@/hooks/media/useMyContent';
import { useUploadQueue } from '@/hooks/media/useUploadQueue';
import type { ContributorMe } from '@/types/media/contributor';

export default function ContributorHomeScreen() {
  return (
    <ContributorGate returnTo="/contributor">
      {(me) => <ContributorHome me={me} />}
    </ContributorGate>
  );
}

/**
 * The correspondent's home.
 *
 * Quick Post is one tap from here and opens the picker on the next screen's
 * first frame — the whole point of the mode is that a photo taken on the
 * touchline is published before the restart.
 */
function ContributorHome({ me }: { me: ContributorMe }) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const uploads = useUploadQueue();
  const stats = useContributorStats();
  const recent = useMyContent({ limit: 5 });

  const onRefresh = useCallback(() => {
    void stats.refetch();
    void recent.refetch();
  }, [recent, stats]);

  const today = me.todayMatch;
  const totals = stats.data?.totals ?? {};

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background.dark }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      refreshControl={
        <RefreshControl
          refreshing={stats.isRefetching || recent.isRefetching}
          onRefresh={onRefresh}
          tintColor={Colors.darkGold}
        />
      }
    >
      {/* ── Identity + today's match ─────────────────────────── */}
      <View className="px-4 pt-4">
        <Text className="text-[20px] font-bold" style={{ color: Colors.text.primary }}>
          {me.contributor?.display_name || t('contributor.title')}
        </Text>
        <Text className="text-[13px] mt-1" style={{ color: Colors.text.tertiary }}>
          {today
            ? t('contributor.home.todayMatch', {
                match: matchLabel(today, ''),
                date: matchDateLabel(today) ?? '',
              })
            : t('contributor.home.noMatch')}
        </Text>
      </View>

      {/* ── Quick Post ───────────────────────────────────────── */}
      <View className="px-4 pt-4">
        <Touchable
          onPress={() => router.push('/contributor/quick-post')}
          accessibilityRole="button"
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            backgroundColor: Colors.darkGold,
            borderRadius: 16,
            padding: 16,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Zap size={22} color={Colors.text.dark} />
          <View className="flex-1">
            <Text className="text-[16px] font-bold" style={{ color: Colors.text.dark }}>
              {t('contributor.home.quickPost')}
            </Text>
            <Text className="text-[12px] mt-0.5" style={{ color: Colors.text.dark }}>
              {t('contributor.home.quickPostHint')}
            </Text>
          </View>
          <ChevronRight size={20} color={Colors.text.dark} />
        </Touchable>
      </View>

      {/* ── Secondary actions ────────────────────────────────── */}
      <View className="px-4 pt-3 gap-3">
        <ActionRow
          icon={<FileEdit size={20} color={Colors.darkGold} />}
          label={t('contributor.home.fullPost')}
          onPress={() => router.push('/contributor/create')}
        />
        <ActionRow
          icon={<ListVideo size={20} color={Colors.darkGold} />}
          label={t('contributor.home.myContent')}
          onPress={() => router.push('/contributor/my-content')}
        />
        <ActionRow
          icon={<UploadCloud size={20} color={Colors.darkGold} />}
          label={t('contributor.home.uploads')}
          badge={uploads.length || undefined}
          onPress={() => router.push('/contributor/uploads')}
        />
      </View>

      {/* ── Live upload queue ────────────────────────────────── */}
      {uploads.length ? (
        <View className="pt-5">
          <View className="px-4">
            <SectionHeading title={t('contributor.uploads.title')} />
          </View>
          <UploadProgressList entries={uploads} />
        </View>
      ) : null}

      {/* ── Stats ────────────────────────────────────────────── */}
      <View className="pt-5">
        <View className="px-4">
          <SectionHeading title={t('contributor.stats.title')} />
        </View>
        <View className="flex-row px-4 gap-3">
          <StatTile
            label={t('contributor.stats.published')}
            value={stats.data?.published_items ?? 0}
          />
          <StatTile label={t('contributor.stats.views')} value={totals.views ?? 0} />
          <StatTile label={t('contributor.stats.likes')} value={totals.likes ?? 0} />
        </View>
      </View>

      {/* ── Recent items ─────────────────────────────────────── */}
      <View className="pt-5">
        <View className="px-4">
          <SectionHeading
            title={t('contributor.home.recent')}
            action={{
              label: t('casaMedia.seeAll'),
              onPress: () => router.push('/contributor/my-content'),
            }}
          />
        </View>
        {(recent.data?.data ?? []).map((item) => (
          <MyContentRow
            key={item.id}
            item={item}
            onPress={() => router.push({ pathname: '/contributor/create', params: { id: item.id } })}
            onStats={() => router.push(`/contributor/stats/${item.id}`)}
          />
        ))}
        {!recent.isLoading && !(recent.data?.data ?? []).length ? (
          <Text className="px-4 text-[13px]" style={{ color: Colors.text.muted }}>
            {t('contributor.myContent.emptyBody')}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  badge?: number;
}) {
  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: Colors.background.card,
        borderWidth: 1,
        borderColor: Colors.border.default,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {icon}
      <Text className="flex-1 text-[14px] font-semibold" style={{ color: Colors.text.primary }}>
        {label}
      </Text>
      {badge ? (
        <View
          style={{
            minWidth: 20,
            height: 20,
            borderRadius: 10,
            paddingHorizontal: 6,
            backgroundColor: Colors.darkGold,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text className="text-[11px] font-bold" style={{ color: Colors.text.dark }}>
            {String(badge)}
          </Text>
        </View>
      ) : null}
      <ChevronRight size={18} color={Colors.text.muted} />
    </Touchable>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <View
      className="flex-1 items-center py-3 rounded-xl"
      style={{
        backgroundColor: Colors.background.card,
        borderWidth: 1,
        borderColor: Colors.border.default,
      }}
    >
      <View className="flex-row items-center gap-1">
        <BarChart3 size={12} color={Colors.text.muted} />
        {/* Counters are digit runs: pinned LTR so they don't reverse in Arabic. */}
        <Text
          className="text-[17px] font-bold"
          style={{ color: Colors.text.primary, writingDirection: 'ltr' }}
        >
          {String(value)}
        </Text>
      </View>
      <Text className="text-[11px] mt-1 text-center" style={{ color: Colors.text.tertiary }}>
        {label}
      </Text>
    </View>
  );
}
