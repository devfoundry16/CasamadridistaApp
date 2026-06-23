import React, { useState } from 'react';
import { View, FlatList, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Play } from 'lucide-react-native';
import type { PostMedia as PostMediaType } from '@/services/FeedService';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FEED_HEIGHT = 250;

function ImageItem({ media }: { media: PostMediaType }) {
  return (
    <Image
      source={{ uri: media.thumbnail_url ?? undefined }}
      placeholder={media.blurhash ?? undefined}
      style={{ width: SCREEN_WIDTH, height: FEED_HEIGHT }}
      contentFit="cover"
      transition={300}
    />
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
    <Pressable
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
    </Pressable>
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
}: {
  items: PostMediaType[];
  playingId: string | null;
  onPlay: (id: string) => void;
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
            <ImageItem media={item} />
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
  const [playingId, setPlayingId] = useState<string | null>(null);
  const ready = media.filter((m) => m.status === 'ready');
  if (!ready.length) return null;

  if (ready.length > 1) {
    return (
      <View className="mt-1">
        <Carousel items={ready} playingId={playingId} onPlay={setPlayingId} />
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
        <ImageItem media={m} />
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
