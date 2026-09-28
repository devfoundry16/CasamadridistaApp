import React, { useCallback, useRef } from 'react';
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  ViewToken,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useInfiniteQuery } from '@tanstack/react-query';
import FeedService, { type FeedPage, type FeedTab, type Post } from '@/services/FeedService';
import PostCard from './PostCard';
import Colors from '@/constants/colors';

/**
 * A Community feed tab, or any other list of posts in the feed's page shape
 * (the hashtag feed). A `source` key must start with `'feed'`, so a like or a
 * save patched into `['feed']` reaches it too (`PostActions`).
 */
type Props =
  | { tab: FeedTab; source?: undefined; emptyText?: string; errorText?: string }
  | {
      tab?: undefined;
      source: { key: readonly ['feed', ...unknown[]]; fetchPage: (cursor: string | null) => Promise<FeedPage> };
      emptyText?: string;
      errorText?: string;
    };

const VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 60,
  minimumViewTime: 300,
};

export default function FeedList({ tab, source, emptyText, errorText }: Props) {
  const { t } = useTranslation();
  const visibleIds = useRef<Set<string>>(new Set());

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

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: Colors.background.medium }}>
        <ActivityIndicator size="large" color={Colors.darkGold} />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: Colors.background.medium }}>
        <Text className="text-center text-base" style={{ color: Colors.text.tertiary }}>
          {errorText ?? t('community.feedFailed')}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.7}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: 80 }}
      style={{ backgroundColor: Colors.background.medium }}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={VIEWABILITY_CONFIG}
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
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center pt-20">
          <Text style={{ color: Colors.text.tertiary }}>{emptyText ?? t('community.noPostsYet')}</Text>
        </View>
      }
    />
  );
}
