import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import type { MediaStoryGroup } from '@/types/media/casaMedia';
import { sizedUri } from '@/utils/mediaUrl';

interface Props {
  groups: MediaStoryGroup[];
  /** Extra top/bottom padding when the rail is a screen header rather than a rail. */
  compact?: boolean;
}

const SIZE = 64;
const RING = 2;

/**
 * The circular story rail. Rendered on the hub, the Home screen and above the
 * community feed — one component, one behaviour.
 *
 * Unviewed groups get the gold ring; viewed ones a neutral one. That is the
 * entire state model, and it comes from the server (`viewed`), not local
 * bookkeeping, so it survives a reinstall and matches other devices.
 */
export default function StoriesRow({ groups, compact = false }: Props) {
  const router = useRouter();

  const renderItem = useCallback(
    ({ item }: { item: MediaStoryGroup }) => {
      const uri = sizedUri(item.cover_url, SIZE);
      return (
        <Touchable
          onPress={() => router.push(`/media/story/${item.id}`)}
          accessibilityRole="button"
          accessibilityLabel={item.title ?? undefined}
          style={({ pressed }) => ({ width: SIZE + 16, opacity: pressed ? 0.8 : 1 })}
        >
          <View
            style={[
              styles.ring,
              { borderColor: item.viewed ? Colors.border.light : Colors.darkGold },
            ]}
          >
            <Image
              source={uri ? { uri } : undefined}
              placeholder={item.cover_blurhash ?? undefined}
              placeholderContentFit="cover"
              style={styles.avatar}
              contentFit="cover"
              transition={140}
              cachePolicy="memory-disk"
              recyclingKey={item.id}
              accessibilityIgnoresInvertColors
            />
          </View>
          <Text
            className="text-[10px]"
            style={{ color: Colors.text.tertiary, textAlign: 'center', marginTop: 5 }}
            numberOfLines={1}
          >
            {item.title ?? ''}
          </Text>
        </Touchable>
      );
    },
    [router],
  );

  if (!groups.length) return null;

  return (
    <FlatList
      data={groups}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={{
        paddingHorizontal: 16,
        gap: 8,
        paddingVertical: compact ? 8 : 12,
      }}
      windowSize={5}
      removeClippedSubviews
    />
  );
}

const styles = StyleSheet.create({
  ring: {
    width: SIZE + RING * 4,
    height: SIZE + RING * 4,
    borderRadius: (SIZE + RING * 4) / 2,
    borderWidth: RING,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  avatar: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: Colors.background.card,
  },
});
