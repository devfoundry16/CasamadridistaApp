import React, { useCallback, useRef } from 'react';
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  ViewToken,
} from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import FeedService, { type FeedTab, type Post } from '@/services/FeedService';
import PostCard from './PostCard';
import Colors from '@/constants/colors';

interface Props {
  tab: FeedTab;
}

const VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 60,
  minimumViewTime: 300,
};

export default function FeedList({ tab }: Props) {
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
    queryKey: ['feed', tab],
    queryFn: ({ pageParam }) => FeedService.getFeed(tab, pageParam ?? null),
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
          Failed to load feed. Pull to refresh.
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
          <Text style={{ color: Colors.text.tertiary }}>No posts yet. Be the first!</Text>
        </View>
      }
    />
  );
}
