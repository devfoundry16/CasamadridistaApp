import { useRouter } from 'expo-router';
import { Clapperboard } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';

import CollectionGrid from '@/components/Media/CollectionGrid';
import HubHeader from '@/components/Media/HubHeader';
import MediaRail from '@/components/Media/MediaRail';
import StoriesRow from '@/components/Media/Stories/StoriesRow';
import TimelineRow from '@/components/Media/TimelineRow';
import Chip from '@/components/Team/Chip';
import EmptyState from '@/components/Team/EmptyState';
import ErrorState from '@/components/Team/ErrorState';
import SectionHeading from '@/components/Team/SectionHeading';
import Colors from '@/constants/colors';
import { useMediaHome } from '@/hooks/media/useHome';

/**
 * The Casa Media hub.
 *
 * A plain `ScrollView` of rails rather than a virtualised list: the payload is
 * one bounded response (a handful of rails, ~30 items total), so virtualisation
 * would buy nothing and cost the smooth nested-scroll behaviour the rails need.
 */
export default function MediaHubScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useMediaHome();

  const seeAll = useCallback(
    (collection: string) => () => router.push(`/media/list/${collection}`),
    [router],
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.darkGold} />
      </View>
    );
  }

  /**
   * Static navigation: it needs no hub payload, so it renders both when the
   * hub is empty and when the hub request failed. Five of the six destinations
   * query `/items` directly; `latest-match` reads the hub and falls back to the
   * archive, landing on its own resolving state rather than an error.
   */
  const browse = (
    <>
      <View style={{ marginTop: 14, paddingHorizontal: 16 }}>
        <SectionHeading title={t('casaMedia.browse')} />
      </View>
      <CollectionGrid />
    </>
  );

  // A failed hub request costs the rails, not the tab: the header and the six
  // collections stay reachable above the error. `ErrorState`'s default variant
  // is `flex-1`, which collapses to nothing inside a ScrollView — hence
  // `compact`, the variant written for exactly this position.
  if (isError || !data) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.background.deepDark }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.darkGold}
            colors={[Colors.darkGold]}
          />
        }
      >
        <HubHeader />
        {browse}
        <View style={{ marginTop: 28 }}>
          <ErrorState compact title={t('casaMedia.loadFailed')} onRetry={refetch} />
        </View>
      </ScrollView>
    );
  }

  const now = data.from_madrid_now;
  const isEmpty =
    !data.featured.length &&
    !data.latest.length &&
    !data.stories.length &&
    !(now?.items.length ?? 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background.deepDark }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={Colors.darkGold}
          colors={[Colors.darkGold]}
        />
      }
    >
      <HubHeader />

      {browse}

      {data.stories.length ? <StoriesRow groups={data.stories} /> : null}

      {isEmpty ? (
        <EmptyState
          icon={Clapperboard}
          title={t('casaMedia.hubEmptyTitle')}
          body={t('casaMedia.hubEmptyBody')}
        />
      ) : null}

      {now && now.items.length ? (
        <View style={{ marginTop: 12 }}>
          <View style={{ paddingHorizontal: 16 }}>
            <SectionHeading
              title={t('casaMedia.fromMadridNow')}
              action={
                now.match
                  ? {
                      label: t('casaMedia.seeAll'),
                      onPress: () =>
                        router.push({
                          pathname: '/media/now',
                          params: { matchId: String(now.match!.id) },
                        }),
                    }
                  : undefined
              }
            />
          </View>
          {now.items.slice(0, 5).map((item, index, list) => (
            <TimelineRow key={item.id} item={item} isLast={index === list.length - 1} />
          ))}
        </View>
      ) : null}

      {/*
        No "see all": the rail already renders every active featured placement
        (the backend caps `media_home`/`featured` at 10 and returns all of
        them), and the link used to point at `exclusive` — a different set than
        what the rail shows. Exclusive has its own tile in the grid above.
      */}
      <MediaRail title={t('casaMedia.featured')} items={data.featured} />

      {data.categories.length ? (
        <View style={{ marginTop: 20, paddingHorizontal: 16 }}>
          <SectionHeading title={t('casaMedia.categories')} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {data.categories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                active={false}
                onPress={() =>
                  router.push({
                    pathname: '/media/list/[collection]',
                    // The chip filters by category and nothing else — the
                    // backend resolves the slug. Pairing it with `exclusive`
                    // would AND the two filters and hide most of the category.
                    params: { collection: 'all', category: category.slug },
                  })
                }
              />
            ))}
          </View>
        </View>
      ) : null}

      <MediaRail
        title={t('casaMedia.latest')}
        items={data.latest}
        seeAllLabel={t('casaMedia.seeAll')}
        // "Latest" is the newest media across everything (`home.latest` is
        // `listPublished({ limit: 12 })`), so "see all" is the unfiltered list.
        // `latest-match` is a different thing — one fixture's media — and
        // sending this rail there silently narrowed the result.
        onSeeAll={seeAll('all')}
        widthRatio={0.44}
      />
    </ScrollView>
  );
}

const styles = {
  centered: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.background.deepDark,
  },
};
