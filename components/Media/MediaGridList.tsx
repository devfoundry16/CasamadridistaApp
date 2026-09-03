import { Clapperboard } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View, useWindowDimensions } from 'react-native';

import EmptyState from '@/components/Team/EmptyState';
import ErrorState from '@/components/Team/ErrorState';
import Colors from '@/constants/colors';
import { useMediaViews } from '@/hooks/media/useMediaViews';
import type { MediaItem } from '@/types/media/casaMedia';
import MediaCard from './MediaCard';

interface Props {
  items: MediaItem[];
  isLoading: boolean;
  isError?: boolean;
  errorTitle?: string;
  onRetry?: () => void;
  emptyTitle: string;
  emptyBody?: string;
  onEndReached?: () => void;
  isFetchingNextPage?: boolean;
  isRefetching?: boolean;
  onRefresh?: () => void;
  ListHeaderComponent?: React.ComponentProps<typeof FlatList>['ListHeaderComponent'];
}

const COLUMNS = 2;
const GAP = 12;
const EDGE = 16;

/**
 * The 2-column paged grid behind every "list of media" screen (collections,
 * search results, saved). Owns impression reporting so no screen has to
 * remember to wire `onViewableItemsChanged`.
 */
export default function MediaGridList({
  items,
  isLoading,
  isError = false,
  errorTitle,
  onRetry,
  emptyTitle,
  emptyBody,
  onEndReached,
  isFetchingNextPage = false,
  isRefetching = false,
  onRefresh,
  ListHeaderComponent,
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.floor((screenWidth - EDGE * 2 - GAP) / COLUMNS);
  const { onViewableItemsChanged, viewabilityConfig } = useMediaViews();

  const renderItem = useCallback(
    ({ item }: { item: MediaItem }) => (
      <MediaCard item={item} variant="grid" width={cardWidth} />
    ),
    [cardWidth],
  );

  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: Colors.background.deepDark }}
      >
        <ActivityIndicator size="large" color={Colors.darkGold} />
      </View>
    );
  }

  if (isError && onRetry) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.background.deepDark }}>
        <ErrorState title={errorTitle ?? ''} onRetry={onRetry} />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      numColumns={COLUMNS}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={ListHeaderComponent}
      columnWrapperStyle={{ gap: GAP }}
      contentContainerStyle={{
        gap: 18,
        paddingHorizontal: EDGE,
        paddingTop: 12,
        paddingBottom: 40,
        flexGrow: 1,
      }}
      style={{ backgroundColor: Colors.background.deepDark }}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.6}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      windowSize={5}
      removeClippedSubviews
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={Colors.darkGold}
            colors={[Colors.darkGold]}
          />
        ) : undefined
      }
      ListEmptyComponent={
        <EmptyState icon={Clapperboard} title={emptyTitle} body={emptyBody} />
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <View className="py-4 items-center">
            <ActivityIndicator color={Colors.darkGold} />
          </View>
        ) : null
      }
    />
  );
}
