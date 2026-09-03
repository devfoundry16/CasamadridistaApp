import { Image } from 'expo-image';
import React, { useCallback } from 'react';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';

import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import type { MediaAsset } from '@/types/media/casaMedia';
import { assetPreviewUri, sizedUri } from '@/utils/mediaUrl';

interface Props {
  assets: MediaAsset[];
  onPressAsset: (index: number) => void;
  /** Horizontal page padding the grid sits inside. */
  edge?: number;
}

const COLUMNS = 3;
const GAP = 2;

/**
 * A gallery's assets as a dense 3-column grid.
 *
 * Fixed square cells with `getItemLayout`: a gallery can be 200 photos and the
 * scroll bar must not resize as cells measure. Tapping a cell opens the pager
 * viewer at that index.
 */
export default function GalleryGrid({ assets, onPressAsset, edge = 16 }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const cell = Math.floor((screenWidth - edge * 2 - GAP * (COLUMNS - 1)) / COLUMNS);
  const stride = cell + GAP;

  const renderItem = useCallback(
    ({ item, index }: { item: MediaAsset; index: number }) => {
      const uri = sizedUri(assetPreviewUri(item), cell);
      return (
        <Touchable
          onPress={() => onPressAsset(index)}
          accessibilityRole="imagebutton"
          style={({ pressed }) => ({
            width: cell,
            height: cell,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <View style={styles.cell}>
            <Image
              source={uri ? { uri } : undefined}
              placeholder={item.blurhash ?? undefined}
              placeholderContentFit="cover"
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={120}
              cachePolicy="memory-disk"
              recyclingKey={item.id}
              accessibilityIgnoresInvertColors
            />
          </View>
        </Touchable>
      );
    },
    [cell, onPressAsset],
  );

  /**
   * With `numColumns > 1` FlatList groups items into rows before it reaches
   * VirtualizedList (`getItemCount` returns `ceil(len / numColumns)`), so the
   * `index` here is a ROW index, not an item index. Dividing it by COLUMNS —
   * as an item-indexed implementation would — collapsed every pair of rows onto
   * the same offset and broke scroll positioning for long galleries.
   */
  const getItemLayout = useCallback(
    (_data: ArrayLike<MediaAsset> | null | undefined, rowIndex: number) => ({
      length: stride,
      offset: stride * rowIndex,
      index: rowIndex,
    }),
    [stride],
  );

  return (
    <FlatList
      data={assets}
      numColumns={COLUMNS}
      scrollEnabled={false}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      columnWrapperStyle={{ gap: GAP }}
      contentContainerStyle={{ gap: GAP, paddingHorizontal: edge }}
      removeClippedSubviews
      windowSize={5}
    />
  );
}

const styles = StyleSheet.create({
  cell: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: Colors.background.card,
  },
});
