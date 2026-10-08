import { Image } from 'expo-image';
import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';

import EmptyState from '@/components/Team/EmptyState';
import ErrorState from '@/components/Team/ErrorState';
import SectionHeading from '@/components/Team/SectionHeading';
import SurfaceCard from '@/components/Team/SurfaceCard';
import { Text } from '@/components/Text';
import Colors from '@/constants/colors';
import { statShares } from '@/utils/matchCenter.core';

interface TabQuery<T> {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  isRefetching: boolean;
  refetch: () => unknown;
}

interface TabScrollProps<T> {
  query: TabQuery<T>;
  /** True when the answer holds nothing worth a card. */
  isEmpty: (data: T) => boolean;
  empty: { icon?: LucideIcon; title: string; body?: string };
  children: (data: T) => React.ReactNode;
}

/**
 * The shell of every match tab: a skeleton while loading, an error with retry,
 * an empty state when the API sent nothing, and otherwise the cards, with pull
 * to refresh. Each tab owns its own query, so one failing tab leaves the
 * others alone.
 */
export function TabScroll<T>({ query, isEmpty, empty, children }: TabScrollProps<T>) {
  const { t } = useTranslation();
  if (query.isPending) return <Skeleton />;
  if (query.isError || !query.data) {
    return <ErrorState title={t('match.center.tabError')} onRetry={() => void query.refetch()} />;
  }
  if (isEmpty(query.data)) {
    return <EmptyState icon={empty.icon} title={empty.title} body={empty.body} />;
  }
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background.deepDark }}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching}
          onRefresh={() => void query.refetch()}
          tintColor={Colors.darkGold}
        />
      }
    >
      {children(query.data)}
    </ScrollView>
  );
}

/** Grey blocks shaped like the cards that will replace them. */
export function Skeleton() {
  return (
    <View style={{ padding: 16, gap: 16 }} accessibilityLabel="loading">
      {[120, 180, 140].map((h, i) => (
        <View key={i} style={{ height: h, borderRadius: 16, backgroundColor: Colors.background.medium }} />
      ))}
    </View>
  );
}

export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <SurfaceCard>
      {title ? <SectionHeading title={title} /> : null}
      {children}
    </SurfaceCard>
  );
}

export function Crest({ uri, size = 22 }: { uri: string | null | undefined; size?: number }) {
  if (!uri) return <View style={{ width: size, height: size }} />;
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

/**
 * One comparison row: home value, label, away value, and a split bar under
 * it. The bar is left out when the values are not numbers.
 */
export function StatBar({ label, home, away }: { label: string; home: unknown; away: unknown }) {
  const shares = statShares(home, away);
  const show = (v: unknown) => (v === null || v === undefined ? '–' : String(v));
  return (
    <View style={{ paddingVertical: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text className="text-[14px] font-bold" style={{ color: Colors.text.primary, minWidth: 48, fontVariant: ['tabular-nums'] }}>
          {show(home)}
        </Text>
        <Text className="text-[13px]" style={{ flex: 1, textAlign: 'center', color: Colors.text.secondary }} numberOfLines={2}>
          {label}
        </Text>
        <Text
          className="text-[14px] font-bold"
          style={{ color: Colors.text.primary, minWidth: 48, textAlign: 'right', fontVariant: ['tabular-nums'] }}
        >
          {show(away)}
        </Text>
      </View>
      {shares ? (
        <View style={{ flexDirection: 'row', height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 6, gap: 2 }}>
          <View style={{ flex: shares.home, backgroundColor: Colors.darkGold }} />
          <View style={{ flex: shares.away, backgroundColor: Colors.background.gray }} />
        </View>
      ) : null}
    </View>
  );
}

const RESULT_FILL = { W: Colors.status.success, D: Colors.status.warning, L: Colors.status.error } as const;

/** A W/D/L dot. Dark ink on the status fills (white fails contrast there). */
export function ResultDot({ result }: { result: 'W' | 'D' | 'L' }) {
  const { t } = useTranslation();
  const label = { W: t('team.a11yWin'), D: t('team.a11yDraw'), L: t('team.a11yLoss') }[result];
  return (
    <View
      accessibilityLabel={label}
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: RESULT_FILL[result],
      }}
    >
      <Text className="text-[11px] font-bold" style={{ color: Colors.background.dark }}>
        {label?.slice(0, 1)}
      </Text>
    </View>
  );
}

/** "Updated 14:05", from the server's fetch time. */
export function Updated({ at }: { at: string | undefined }) {
  const { t } = useTranslation();
  if (!at) return null;
  const time = new Date(at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return (
    <Text className="text-[11px] text-center" style={{ color: Colors.text.muted }}>
      {t('match.center.updated', { time })}
    </Text>
  );
}

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * A scoreline as THREE sibling texts in a row, never one "2 - 1" string. The
 * row mirrors under RTL together with the crests around it, so each number
 * stays next to its own team on both platforms (same reasoning as
 * components/Team/ResultPill.tsx).
 */
export function Score({
  home,
  away,
  size = 18,
}: {
  home: number | null;
  away: number | null;
  size?: number;
}) {
  const style = { color: Colors.text.primary, fontSize: size, fontWeight: '700' as const, fontVariant: ['tabular-nums' as const] };
  if (home == null || away == null) {
    return <Text style={style}>vs</Text>;
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text style={style}>{home}</Text>
      <Text style={style}>-</Text>
      <Text style={style}>{away}</Text>
    </View>
  );
}
