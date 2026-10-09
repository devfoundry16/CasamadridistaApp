import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  AppState,
  FlatList,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  ViewToken,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useInfiniteQuery } from '@tanstack/react-query';
import FeedService, { type FeedPage, type FeedTab, type Post } from '@/services/FeedService';
import PostCard from './PostCard';
import { FeedPlaybackProvider, createActiveVideoStore } from './FeedPlayback';
import Colors from '@/constants/colors';
import { pickActiveVideo } from '@/utils/feedAutoplay.core';

/**
 * A Community feed tab, or any other list of posts in the feed's page shape
 * (the hashtag feed). A `source` key must start with `'feed'`, so a like or a
 * save patched into `['feed']` reaches it too (`PostActions`).
 */
interface Common {
  emptyText?: string;
  errorText?: string;
  /** Scrolls with the posts, above them (Home's composer, stories and tabs). */
  header?: React.ReactElement | null;
}

type Props =
  | (Common & { tab: FeedTab; source?: undefined })
  | (Common & {
      tab?: undefined;
      source: { key: readonly ['feed', ...unknown[]]; fetchPage: (cursor: string | null) => Promise<FeedPage> };
    });

const VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 60,
  minimumViewTime: 300,
};

export default function FeedList({ tab, source, emptyText, errorText, header }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const visibleIds = useRef<Set<string>>(new Set());

  // One video plays per list: the first ready one in view. It stops while the
  // screen is not in front (another tab, a pushed screen) or the app is in the
  // background, and resumes with the same pick when it comes back.
  const activeVideo = useRef(createActiveVideoStore()).current;
  const picked = useRef<string | null>(null);
  const focused = useIsFocused();
  // Only true backgrounding stops it, not iOS's brief "inactive" (Control
  // Center, a call banner), which would restart the video from 0.
  const foreground = useRef(AppState.currentState !== 'background');
  const applyActive = useCallback(() => {
    activeVideo.set(focused && foreground.current ? picked.current : null);
  }, [activeVideo, focused]);
  useEffect(() => {
    applyActive();
    const sub = AppState.addEventListener('change', (state) => {
      foreground.current = state !== 'background';
      applyActive();
    });
    return () => sub.remove();
  }, [applyActive]);
  const applyActiveRef = useRef(applyActive);
  applyActiveRef.current = applyActive;

  const playback = useMemo(
    () => ({
      active: activeVideo,
      // A tab feed opens the viewer over that feed's videos. Other lists (a
      // hashtag) open it on the one post.
      openVideo: (postId: string) =>
        router.push({ pathname: '/community/videos/[postId]', params: tab ? { postId, feed: tab } : { postId } }),
    }),
    [activeVideo, router, tab],
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: source ? source.key : ['feed', tab],
    queryFn: ({ pageParam }) =>
      source ? source.fetchPage(pageParam ?? null) : FeedService.getFeed(tab, pageParam ?? null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  });

  const posts: Post[] = data?.pages.flatMap((p) => p.posts) ?? [];

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const ids = new Set(viewableItems.map((v) => (v.item as Post).id));
      visibleIds.current = ids;

      picked.current = pickActiveVideo(viewableItems);
      applyActiveRef.current();

      // Batch view tracking (fire-and-forget)
      if (ids.size > 0) {
        FeedService.recordViews([...ids]);
      }
    },
    []
  );

  const renderItem = useCallback(({ item }: { item: Post }) => {
    return <PostCard post={item} />;
  }, []);

  const keyExtractor = useCallback((item: Post) => item.id, []);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const empty = isLoading ? (
    <View className="items-center justify-center pt-20">
      <ActivityIndicator size="large" color={Colors.darkGold} />
    </View>
  ) : isError ? (
    <View className="items-center justify-center px-8 pt-20">
      <Text className="text-center text-base" style={{ color: Colors.text.tertiary }}>
        {errorText ?? t('community.feedFailed')}
      </Text>
    </View>
  ) : (
    <View className="flex-1 items-center justify-center pt-20">
      <Text style={{ color: Colors.text.tertiary }}>{emptyText ?? t('community.noPostsYet')}</Text>
    </View>
  );

  // The header stays on screen while posts load or fail: the composer and
  // stories above a feed do not depend on it.
  return (
    <FeedPlaybackProvider value={playback}>
      <FlatList
        data={posts}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={header}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.7}
        contentContainerStyle={{ paddingTop: header ? 0 : 8, paddingBottom: 80 }}
        style={{ backgroundColor: Colors.background.medium }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        windowSize={7}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.darkGold}
            colors={[Colors.darkGold]}
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4 items-center">
              <ActivityIndicator color={Colors.darkGold} />
            </View>
          ) : null
        }
        ListEmptyComponent={empty}
      />
    </FeedPlaybackProvider>
  );
}
