import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';

import { CASA_LOGO } from '@/components/Media/casaLogo';
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
 *
 * Every bubble here is an official Casa Madridista story, so each carries the
 * club's mark, and a "LIVE" pill while its match is being played.
 */
export default function StoriesRow({ groups, compact = false }: Props) {
  const router = useRouter();
  const { t } = useTranslation();

  const renderItem = useCallback(
    ({ item }: { item: MediaStoryGroup }) => {
      const uri = sizedUri(item.cover_url, SIZE);
      return (
        <Touchable
          onPress={() => router.push(`/media/story/${item.id}`)}
          accessibilityRole="button"
          accessibilityLabel={[
            t('community.casaAuthor'),
            item.is_live ? t('casaMedia.liveFromMadrid') : null,
            item.title,
          ]
            .filter(Boolean)
            .join(', ')}
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
            <Image source={CASA_LOGO} style={styles.mark} contentFit="cover" />
            {item.is_live ? (
              <View style={styles.live}>
                <Text className="text-[8px] font-bold" style={{ color: Colors.textWhite }}>
                  {t('casaMedia.liveBadge')}
                </Text>
              </View>
            ) : null}
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
    [router, t],
  );

  if (!groups.length) return null;

  return (
    <FlatList
      data={groups}
      horizontal
      // Sized by its content: above a feed list it would otherwise be squeezed.
      style={{ flexGrow: 0, flexShrink: 0 }}
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
  // The club's mark, on the trailing edge of the ring.
  mark: {
    position: 'absolute',
    bottom: -2,
    end: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.background.deepDark,
    backgroundColor: Colors.background.deepDark,
  },
  live: {
    position: 'absolute',
    top: -6,
    alignSelf: 'center',
    paddingHorizontal: 6,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.status.error,
  },
});
