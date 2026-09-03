import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';

import MediaGridList from '@/components/Media/MediaGridList';
import Colors from '@/constants/colors';
import { collectionTitleKey, isMatchCollection } from '@/hooks/media/collections';
import { useArchive } from '@/hooks/media/useArchive';
import { useMediaHome } from '@/hooks/media/useHome';
import { useMatchMedia } from '@/hooks/media/useMatchMedia';
import { useMediaCollection } from '@/hooks/media/useMediaList';
import { useSavedMedia } from '@/hooks/media/useSaved';
import { isMediaCollection, type MediaCollection } from '@/types/media/casaMedia';

/**
 * The generic "list of media" screen.
 *
 * Three shapes of source hide behind one route:
 *  - `saved` — `GET /saved`, auth-only, genuinely a different endpoint rather
 *    than a filter over `/items`, which is why it is not in `MEDIA_COLLECTIONS`.
 *  - `latest-match` — `GET /matches/:id`. There is no "latest match" filter on
 *    `/items`; the fixture is whatever "From Madrid Now" is currently pointed at,
 *    falling back to the newest match in the archive.
 *  - everything else — a query over `/items` via `collectionToQuery`.
 */
export default function MediaCollectionScreen() {
  const { t } = useTranslation();
  const { collection, category } = useLocalSearchParams<{
    collection: string;
    category?: string;
  }>();

  const isSaved = collection === 'saved';
  const resolved: MediaCollection = isMediaCollection(collection) ? collection : 'all';
  const isMatch = isMatchCollection(resolved);

  // The fixture behind `latest-match`: the live/current match the hub is
  // already showing, else the most recent match in the archive that has media.
  // The archive is only fetched when the hub has settled *without* a match —
  // otherwise this screen would pull a whole archive page to read an id it
  // already had.
  const homeQuery = useMediaHome();
  const hubMatchId = homeQuery.data?.from_madrid_now?.match?.id;
  const needsArchive = isMatch && !homeQuery.isPending && hubMatchId === undefined;
  const archiveQuery = useArchive({}, needsArchive);

  const matchId = isMatch
    ? (hubMatchId ?? archiveQuery.data?.pages[0]?.matches[0]?.match.id)
    : undefined;

  // Every hook must be called (rules of hooks); only the one this screen is
  // actually showing is allowed to hit the network.
  const listQuery = useMediaCollection(
    resolved,
    category ? { category } : {},
    !isSaved && !isMatch,
  );
  const savedQuery = useSavedMedia(isSaved);
  const matchQuery = useMatchMedia(isMatch ? matchId : undefined);

  const query = isSaved ? savedQuery : isMatch ? matchQuery : listQuery;

  /**
   * Which fixture to show is still being resolved.
   *
   * `useMatchMedia` is *disabled* until `matchId` exists, and a disabled React
   * Query reports `isLoading: false` (pending but not fetching) — so without
   * this the screen renders zero items and flashes the empty state while the
   * hub or archive request is still in flight.
   */
  const resolvingMatch =
    isMatch &&
    matchId === undefined &&
    (homeQuery.isPending || (needsArchive && archiveQuery.isPending));

  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const title = isSaved ? t('casaMedia.saved') : t(collectionTitleKey(resolved));

  return (
    <>
      <Stack.Screen
        options={{
          title,
          headerStyle: { backgroundColor: Colors.darkGold },
          headerTintColor: Colors.textWhite,
        }}
      />
      <MediaGridList
        items={items}
        isLoading={query.isLoading || resolvingMatch}
        isError={query.isError}
        errorTitle={t('casaMedia.loadFailed')}
        onRetry={query.refetch}
        emptyTitle={isSaved ? t('casaMedia.savedEmptyTitle') : t('casaMedia.listEmptyTitle')}
        emptyBody={isSaved ? t('casaMedia.savedEmptyBody') : t('casaMedia.listEmptyBody')}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
        }}
        isFetchingNextPage={query.isFetchingNextPage}
        isRefetching={query.isRefetching}
        onRefresh={query.refetch}
      />
    </>
  );
}
