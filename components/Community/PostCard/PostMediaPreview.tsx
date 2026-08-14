import React, { useCallback, useState } from 'react';
import { View, FlatList, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react-native';
import type { PostMedia as PostMediaType } from '@/services/FeedService';
import Colors from '@/constants/colors';
import Touchable from '@/components/Touchable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FEED_HEIGHT = 250;

/**
 * Nested inside the card's outer pressable on purpose: the deepest view that
 * claims the touch responder wins, so tapping the photo opens the viewer while
 * tapping anywhere else on the card still navigates to the post. Same pattern
 * the like/share buttons in PostActions already rely on.
 */
function ImageItem({ media, onPress }: { media: PostMediaType; onPress: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      style={{ width: SCREEN_WIDTH, height: FEED_HEIGHT }}
      accessibilityRole="imagebutton"
      accessibilityLabel={t('community.openPhoto')}
    >
      <Image
        source={{ uri: media.thumbnail_url ?? undefined }}
        placeholder={media.blurhash ?? undefined}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={300}
      />
    </Pressable>
  );
}

function VideoPlayerInline({ media }: { media: PostMediaType }) {
  const src = media.hls_url ?? media.public_url;
  const player = useVideoPlayer(
    src ? { uri: src } : null,
    (p) => {
      p.loop = false;
      p.play();
    }
  );
  return (
    <VideoView
      player={player}
      style={{ width: SCREEN_WIDTH, height: FEED_HEIGHT }}
      contentFit="cover"
      nativeControls
    />
  );
}

function VideoThumbnail({ media, onPlay }: { media: PostMediaType; onPlay: () => void }) {
  return (
    <Touchable
      style={({ pressed }) => ({ width: SCREEN_WIDTH, height: FEED_HEIGHT, backgroundColor: Colors.background.dark, opacity: pressed ? 0.8 : 1 })}
      onPress={onPlay}
    >
      <Image
        source={{ uri: media.thumbnail_url ?? undefined }}
        placeholder={media.blurhash ?? undefined}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={300}
      />
      <View style={styles.playOverlay}>
        <View style={styles.playButton}>
          <Play size={24} color="#fff" fill="#fff" />
        </View>
      </View>
    </Touchable>
  );
}

function DotIndicator({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { backgroundColor: i === activeIndex ? Colors.darkGold : Colors.border.default },
          ]}
        />
      ))}
    </View>
  );
}

function Carousel({
  items,
  playingId,
  onPlay,
  onOpenPhoto,
}: {
  items: PostMediaType[];
  playingId: string | null;
  onPlay: (id: string) => void;
  onOpenPhoto: (media: PostMediaType) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <View>
      <FlatList
        data={items}
        keyExtractor={(m) => m.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        extraData={playingId}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) =>
          item.kind === 'video' ? (
            playingId === item.id ? (
              <VideoPlayerInline media={item} />
            ) : (
              <VideoThumbnail media={item} onPlay={() => onPlay(item.id)} />
            )
          ) : (
            <ImageItem media={item} onPress={() => onOpenPhoto(item)} />
          )
        }
      />
      <DotIndicator count={items.length} activeIndex={currentIndex} />
    </View>
  );
}

interface Props {
  media: PostMediaType[];
}

export default function PostMediaPreview({ media }: Props) {
  const router = useRouter();
  const [playingId, setPlayingId] = useState<string | null>(null);

  const openPhoto = useCallback(
    (m: PostMediaType) => {
      // Pass the media id rather than an index: PostMediaPreview's own index
      // tracking is derived from contentOffset.x, which inverts under RTL.
      router.push({
        pathname: '/community/photo/[postId]',
        params: { postId: m.post_id, mediaId: m.id },
      });
    },
    [router],
  );

  const ready = media.filter((m) => m.status === 'ready');
  if (!ready.length) return null;

  if (ready.length > 1) {
    return (
      <View className="mt-1">
        <Carousel
          items={ready}
          playingId={playingId}
          onPlay={setPlayingId}
          onOpenPhoto={openPhoto}
        />
      </View>
    );
  }

  const m = ready[0];
  return (
    <View className="mt-1" style={{ height: FEED_HEIGHT }}>
      {m.kind === 'video' ? (
        playingId === m.id ? (
          <VideoPlayerInline media={m} />
        ) : (
          <VideoThumbnail media={m} onPlay={() => setPlayingId(m.id)} />
        )
      ) : (
        <ImageItem media={m} onPress={() => openPhoto(m)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 6,
    paddingBottom: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
