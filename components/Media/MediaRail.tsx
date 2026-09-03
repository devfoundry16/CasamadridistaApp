import { Image } from 'expo-image';
import React, { useCallback, useEffect } from 'react';
import { FlatList, View, useWindowDimensions } from 'react-native';

import SectionHeading from '@/components/Team/SectionHeading';
import type { MediaItem } from '@/types/media/casaMedia';
import { coverUri } from '@/utils/mediaUrl';
import MediaCard from './MediaCard';

interface Props {
  title: string;
  items: MediaItem[];
  seeAllLabel?: string;
  onSeeAll?: () => void;
  /** Fraction of the screen width one card occupies. */
  widthRatio?: number;
}

const GAP = 12;
const EDGE = 16;

/**
 * A horizontal rail of media cards.
 *
 * `getItemLayout` is supplied because every card is the same width — without it
 * FlatList measures each cell, which shows up as a stutter on the first flick
 * of a rail that has just been populated from the network.
 */
export default function MediaRail({
  title,
  items,
  seeAllLabel,
  onSeeAll,
  widthRatio = 0.62,
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.round(screenWidth * widthRatio);
  const stride = cardWidth + GAP;

  // Warm the first off-screen covers so the rail does not pop while flicking.
  useEffect(() => {
    const urls = items
      .slice(0, 6)
      .map((item) => coverUri(item, cardWidth))
      .filter((u): u is string => !!u);
    if (urls.length) Image.prefetch(urls, { cachePolicy: 'memory-disk' });
  }, [items, cardWidth]);

  const renderItem = useCallback(
    ({ item }: { item: MediaItem }) => <MediaCard item={item} variant="rail" width={cardWidth} />,
    [cardWidth],
  );

  const getItemLayout = useCallback(
    (_data: ArrayLike<MediaItem> | null | undefined, index: number) => ({
      length: stride,
      offset: stride * index,
      index,
    }),
    [stride],
  );

  if (!items.length) return null;

  return (
    <View style={{ marginTop: 20 }}>
      <View style={{ paddingHorizontal: EDGE }}>
        <SectionHeading
          title={title}
          action={onSeeAll && seeAllLabel ? { label: seeAllLabel, onPress: onSeeAll } : undefined}
        />
      </View>

      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        contentContainerStyle={{ paddingHorizontal: EDGE, gap: GAP, paddingTop: 4 }}
        windowSize={5}
        removeClippedSubviews
        initialNumToRender={3}
      />
    </View>
  );
}
