import { useInfiniteQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Play } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import FeedService from '@/services/FeedService';
import { reelStripItems } from '@/utils/feedAutoplay.core';

const TILE_WIDTH = 96;
const TILE_HEIGHT = Math.round((TILE_WIDTH * 16) / 9);

/**
 * The newest reels as a horizontal strip on Home, under the stories. A tap
 * opens the full-screen viewer on that reel, and swiping carries on through
 * the Reels feed. "See all" switches Home to the Reels tab.
 *
 * It reads the Reels tab's own query (['feed', 'reels'], the same shape the
 * tab and the viewer use), so the three share one cache and a tapped reel is
 * always in the viewer's list. Nothing shows while loading, on an error, or
 * with no reels.
 *
 * The row's height is fixed: inside the feed list's header a horizontal
 * ScrollView otherwise stretches to fill the screen.
 */
export default function ReelStrip({ onSeeAll }: { onSeeAll: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data } = useInfiniteQuery({
    queryKey: ['feed', 'reels'],
    queryFn: ({ pageParam }) => FeedService.getFeed('reels', pageParam ?? null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  });

  const tiles = reelStripItems(data?.pages);
  if (!tiles.length) return null;

  return (
    <View style={{ marginTop: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 }}>
        <Text className="text-[15px] font-bold" style={{ color: Colors.text.primary }}>
          {t('home.reelsTitle')}
        </Text>
        <Touchable onPress={onSeeAll} accessibilityRole="button" hitSlop={8}>
          <Text className="text-[13px] font-semibold" style={{ color: Colors.darkGold }}>
            {t('home.reelsSeeAll')}
          </Text>
        </Touchable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ height: TILE_HEIGHT + 20, flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, gap: 8, alignItems: 'flex-start' }}
        accessibilityLabel={t('home.reelsTitle')}
      >
        {tiles.map((tile) => (
          <Touchable
            key={tile.id}
            onPress={() => router.push({ pathname: '/community/videos/[postId]', params: { postId: tile.id, feed: 'reels' } })}
            accessibilityRole="button"
            accessibilityLabel={t('home.openReel', { name: tile.authorName ?? '' })}
            style={({ pressed }) => ({
              width: TILE_WIDTH,
              height: TILE_HEIGHT,
              borderRadius: 10,
              overflow: 'hidden',
              backgroundColor: Colors.background.card,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            {tile.thumb ? (
              <Image
                source={{ uri: tile.thumb }}
                placeholder={tile.blurhash ?? undefined}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                cachePolicy="memory-disk"
                recyclingKey={tile.id}
                accessibilityIgnoresInvertColors
              />
            ) : null}
            {/* `end`: the trailing corner in both directions. */}
            <View pointerEvents="none" style={{ position: 'absolute', end: 6, top: 6 }}>
              <Play size={14} color="#fff" fill="#fff" />
            </View>
          </Touchable>
        ))}
      </ScrollView>
    </View>
  );
}
