import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import FollowButton from '@/components/Media/FollowButton';
import StoriesRow from '@/components/Media/Stories/StoriesRow';
import Chip from '@/components/Team/Chip';
import Colors from '@/constants/colors';
import { useMatchMedia } from '@/hooks/media/useMatchMedia';
import { useStories } from '@/hooks/media/useStories';
import { MEDIA_PHASES, type MediaItem, type MediaPhase } from '@/types/media/casaMedia';
import MediaGridList from '../MediaGridList';
import MediaRail from '../MediaRail';
import { MediaSurfaceProvider } from '@/components/Media/MediaSurfaceContext';

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

  /**
   * This fixture's story bubble, taken from the global story set rather than a
   * `/items?type=story&match_id=` query.
   *
   * That is deliberate and worth not "fixing": the viewer at
   * `app/media/story/[groupId]` loads `useStories()` and pages through *that*
   * set, and a group's id is the fixture id as a string
   * (`groupStoriesByMatch`). Sourcing the row from a different query would let
   * it show a bubble that opens onto nothing. Consistency with the viewer beats
   * exactness here.
   */
  const { data: storyGroups } = useStories();
  const matchStories = useMemo(
    () => storyGroups?.find((g) => g.id === String(matchId)) ?? null,
    [storyGroups, matchId],
  );

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
          Stories first: they are not phase-filtered and they are the most
          time-sensitive thing on the screen. Same -16 bleed as the pinned rail
          below — StoriesRow carries its own 16pt content padding and the grid
          adds a 16pt gutter, so without it the row is indented twice.

          The grid still contains these stories as cards. That is intended: the
          server computes `phase_counts` including them, so filtering them out
          client-side would make the chip counts disagree with what is on
          screen, and the grid pages, so such a filter would be leaky anyway.
          The row is an extra affordance that opens the story *viewer*, not a
          replacement for the cards.
        */}
        {matchStories ? (
          <View style={{ marginHorizontal: -16 }}>
            <StoriesRow groups={[matchStories]} compact />
          </View>
        ) : null}
        {/*
          Chips in a horizontal scroller, not a SegmentedToggle: there are seven
          options (six contract phases plus "All") and a segmented control
          divides the width equally, which truncates every label on a phone.
          Negative margins let the strip bleed past the grid's 16pt gutter.
        */}
        {/*
          §26 — following this match is what makes "send only to users following
          that match" mean anything. It sits above the phase chips rather than
          inside the scroller: the chips scroll horizontally, and a control that
          can scroll out of reach is one nobody finds.
        */}
        <View style={{ flexDirection: 'row', paddingBottom: 10 }}>
          <FollowButton kind="match" refId={matchId} />
        </View>
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
    [matchStories, matchId, options, phase, pinned, t],
  );

  return (
    <MediaSurfaceProvider surface="match">
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
    </MediaSurfaceProvider>
  );
}
