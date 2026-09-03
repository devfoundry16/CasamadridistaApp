import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import Chip from '@/components/Team/Chip';
import Colors from '@/constants/colors';
import { useMatchMedia } from '@/hooks/media/useMatchMedia';
import { MEDIA_PHASES, type MediaItem, type MediaPhase } from '@/types/media/casaMedia';
import MediaGridList from '../MediaGridList';
import MediaRail from '../MediaRail';

interface Props {
  matchId: number;
}

type PhaseFilter = 'all' | MediaPhase;

// Derived from the contract's phase list so a schema change cannot leave a
// filter behind. Six phases plus "All" is why the toggle scrolls horizontally.
const PHASES: PhaseFilter[] = ['all', ...MEDIA_PHASES];

/**
 * The "Media" tab of the match page.
 *
 * Phase is a client-side filter *parameter*, not a client-side filter: each
 * phase is its own paged query, because a big match has far more assets than
 * one page and filtering after the fact would silently hide items.
 */
export default function MatchMediaScreen({ matchId }: Props) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<PhaseFilter>('all');

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMatchMedia(matchId, phase === 'all' ? {} : { phase });

  const items: MediaItem[] = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );
  // Memoised so the `??` fallbacks do not mint a fresh [] / {} on every render
  // and invalidate the header's useCallback / the options useMemo below.
  const pinned = useMemo(() => data?.pages[0]?.pinned ?? [], [data]);
  const counts = useMemo(() => data?.pages[0]?.phase_counts ?? {}, [data]);

  const options = useMemo(
    () =>
      PHASES.map((key) => ({
        key,
        label:
          key === 'all'
            ? t('casaMedia.phaseAll')
            : `${t(`casaMedia.phase.${key}`)}${counts[key] ? ` (${counts[key]})` : ''}`,
      })),
    [counts, t],
  );

  const header = useCallback(
    () => (
      <View style={{ paddingBottom: 4 }}>
        {/*
          Chips in a horizontal scroller, not a SegmentedToggle: there are seven
          options (six contract phases plus "All") and a segmented control
          divides the width equally, which truncates every label on a phone.
          Negative margins let the strip bleed past the grid's 16pt gutter.
        */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
          style={{ marginHorizontal: -16 }}
        >
          {options.map((option) => (
            <Chip
              key={option.key}
              label={option.label}
              active={option.key === phase}
              onPress={() => setPhase(option.key)}
            />
          ))}
        </ScrollView>
        {pinned.length ? (
          <View style={{ marginHorizontal: -16 }}>
            <MediaRail
              title={t('casaMedia.pinned')}
              items={pinned}
              widthRatio={0.55}
            />
          </View>
        ) : null}
      </View>
    ),
    [options, phase, pinned, t],
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>
      <MediaGridList
        items={items}
        isLoading={isLoading}
        isError={isError}
        errorTitle={t('casaMedia.loadFailed')}
        onRetry={refetch}
        emptyTitle={t('casaMedia.matchEmptyTitle')}
        emptyBody={t('casaMedia.matchEmptyBody')}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        isFetchingNextPage={isFetchingNextPage}
        isRefetching={isRefetching}
        onRefresh={refetch}
        ListHeaderComponent={header}
      />
    </View>
  );
}
