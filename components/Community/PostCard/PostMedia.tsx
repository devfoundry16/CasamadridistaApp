import React, { useCallback, useEffect, useState } from 'react';
import { View, Pressable, Dimensions, ActivityIndicator, FlatList, I18nManager } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { PostMedia as PostMediaType } from '@/services/FeedService';
import Colors from '@/constants/colors';
import { carouselIndex } from '@/utils/post.core';
import { DotIndicator } from './PostMediaPreview';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_HEIGHT = 420;

interface Props {
  media: PostMediaType[];
  paused?: boolean;
}

function aspectRatio(m: PostMediaType) {
  if (m.width && m.height) return m.width / m.height;
  return 16 / 9;
}

/** Plays only while its page is the one on screen and the screen is not paused. */
function VideoPlayer({ media, height, playing }: { media: PostMediaType; height: number; playing: boolean }) {
  const src = media.hls_url ?? media.public_url ?? undefined;
  const player = useVideoPlayer(src ? { uri: src } : null, (p) => {
    p.loop = false;
  });

  useEffect(() => {
    if (playing) player.play();
    else player.pause();
  }, [player, playing]);

  return (
    <View style={{ width: SCREEN_WIDTH, height, backgroundColor: Colors.background.dark }}>
      <VideoView
        player={player}
        style={{ width: SCREEN_WIDTH, height }}
        contentFit="cover"
        nativeControls
      />
    </View>
  );
}

function ImageItem({ media, height, onPress }: { media: PostMediaType; height: number; onPress: () => void }) {
  const { t } = useTranslation();
  const [loaded, setLoaded] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      style={{ width: SCREEN_WIDTH, height }}
      accessibilityRole="imagebutton"
      accessibilityLabel={t('community.openPhoto')}
    >
      {!loaded && (
        <View className="absolute inset-0 items-center justify-center" style={{ backgroundColor: Colors.background.medium }}>
          <ActivityIndicator color={Colors.darkGold} />
        </View>
      )}
      <Image
        source={{ uri: media.thumbnail_url ?? undefined }}
        placeholder={media.blurhash ?? undefined}
        style={{ width: SCREEN_WIDTH, height }}
        contentFit="cover"
        transition={300}
        onLoad={() => setLoaded(true)}
      />
    </Pressable>
  );
}

/**
 * The post detail's media: one item full-width, or a paging carousel with dots
 * — the `PostMediaPreview` pattern at the detail's larger size.
 *
 * Every page takes the first item's height (capped), so the carousel does not
 * jump as it is swiped; the rest are cropped to fit, as in the feed.
 */
export default function PostMedia({ media, paused = true }: Props) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const openPhoto = useCallback(
    (m: PostMediaType) => {
      router.push({
        pathname: '/community/photo/[postId]',
        params: { postId: m.post_id, mediaId: m.id },
      });
    },
    [router],
  );

  const ready = media.filter((m) => m.status === 'ready');
  if (!ready.length) return null;

  const height = Math.min(SCREEN_WIDTH / aspectRatio(ready[0]), MAX_HEIGHT);

  const renderItem = (m: PostMediaType, index: number) =>
    m.kind === 'video' ? (
      <VideoPlayer key={m.id} media={m} height={height} playing={!paused && index === currentIndex} />
    ) : (
      <ImageItem key={m.id} media={m} height={height} onPress={() => openPhoto(m)} />
    );

  if (ready.length === 1) {
    return <View className="mt-1">{renderItem(ready[0], 0)}</View>;
  }

  return (
    <View className="mt-1">
      <FlatList
        data={ready}
        keyExtractor={(m) => m.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        extraData={currentIndex}
        // Up to ten full-width photos per post: mount the visible one and its
        // neighbours, not all ten, for every card in the feed.
        initialNumToRender={1}
        windowSize={3}
        maxToRenderPerBatch={2}
        onMomentumScrollEnd={(e) => {
          // Under RTL `contentOffset.x` counts from the last item, so the raw
          // quotient is inverted; `carouselIndex` turns it back.
          setCurrentIndex(carouselIndex(e.nativeEvent.contentOffset.x, SCREEN_WIDTH, ready.length, I18nManager.isRTL));
        }}
        renderItem={({ item, index }) => renderItem(item, index)}
      />
      <DotIndicator count={ready.length} activeIndex={currentIndex} />
    </View>
  );
}
