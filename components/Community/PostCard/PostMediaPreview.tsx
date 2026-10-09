import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, Pressable, StyleSheet, Dimensions, I18nManager } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Play, Volume2, VolumeX } from 'lucide-react-native';
import type { PostMedia as PostMediaType } from '@/services/FeedService';
import Colors from '@/constants/colors';
import Touchable from '@/components/Touchable';
import { carouselIndex } from '@/utils/post.core';
import { playableUri } from '@/utils/feedAutoplay.core';
import { videoProgress } from '@/utils/stories.core';
import { feedMutedNow, useFeedMuted, useIsActiveVideo, useOpenVideo } from '../FeedPlayback';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FEED_HEIGHT = 250;
/** A reel's 9:16 frame, capped so one card never fills more than most of the screen. */
const REEL_HEIGHT = Math.min(Math.round((SCREEN_WIDTH * 16) / 9), 560);

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

/**
 * The feed's one playing video: the post the list picked (first ready video in
 * view). Muted by the app-wide sound choice, looping, no native controls; a
 * tap opens it full screen. Mounted only while active, so a feed holds a
 * single player (MediaVideoPlayer.tsx, plan §5.8).
 */
function AutoplayVideo({ media, onOpen, height = FEED_HEIGHT }: { media: PostMediaType; onOpen: () => void; height?: number }) {
  const { t } = useTranslation();
  const [muted, toggleMuted] = useFeedMuted();
  const [progress, setProgress] = useState(0);
  const src = playableUri(media);
  const player = useVideoPlayer(src ? { uri: src } : null, (p) => {
    p.loop = true;
    p.muted = feedMutedNow();
    p.timeUpdateEventInterval = 0.25;
    p.play();
  });

  useEffect(() => {
    player.muted = muted;
  }, [player, muted]);

  useEffect(() => {
    const sub = player.addListener('timeUpdate', ({ currentTime }) => setProgress(videoProgress(currentTime, player.duration)));
    return () => sub.remove();
  }, [player]);

  return (
    <Pressable
      onPress={onOpen}
      style={{ width: SCREEN_WIDTH, height, backgroundColor: Colors.background.dark }}
      accessibilityRole="button"
      accessibilityLabel={t('video.openFullScreen')}
    >
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      <Pressable
        onPress={toggleMuted}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={muted ? t('video.unmute') : t('video.mute')}
        style={styles.muteButton}
      >
        {muted ? <VolumeX size={18} color="#fff" /> : <Volume2 size={18} color="#fff" />}
      </Pressable>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
    </Pressable>
  );
}

function VideoThumbnail({ media, onPlay, height = FEED_HEIGHT }: { media: PostMediaType; onPlay: () => void; height?: number }) {
  const { t } = useTranslation();
  return (
    <Touchable
      style={({ pressed }) => ({ width: SCREEN_WIDTH, height, backgroundColor: Colors.background.dark, opacity: pressed ? 0.8 : 1 })}
      onPress={onPlay}
      accessibilityRole="button"
      accessibilityLabel={t('video.openFullScreen')}
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

/** `activeIndex` is logical; the row itself mirrors under RTL. Shared with `PostMedia`. */
export function DotIndicator({ count, activeIndex }: { count: number; activeIndex: number }) {
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

/** Several photos. A video post carries exactly one video, so none play here. */
function Carousel({
  items,
  onOpenVideo,
  onOpenPhoto,
}: {
  items: PostMediaType[];
  onOpenVideo: () => void;
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
        // Up to ten full-width photos per post: mount the visible one and its
        // neighbours, not all ten, for every card in the feed.
        initialNumToRender={1}
        windowSize={3}
        maxToRenderPerBatch={2}
        onMomentumScrollEnd={(e) => {
          // Under RTL `contentOffset.x` counts from the last item, so the raw
          // quotient is inverted; `carouselIndex` turns it back.
          setCurrentIndex(carouselIndex(e.nativeEvent.contentOffset.x, SCREEN_WIDTH, items.length, I18nManager.isRTL));
        }}
        renderItem={({ item }) =>
          item.kind === 'video' ? (
            <VideoThumbnail media={item} onPlay={onOpenVideo} />
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
  /** A reel: its one vertical video in a tall 9:16 frame. */
  tall?: boolean;
}

export default function PostMediaPreview({ media, tall = false }: Props) {
  const router = useRouter();
  const postId = media[0]?.post_id ?? '';
  const active = useIsActiveVideo(postId);
  const openInFeed = useOpenVideo();
  // Full screen: over the list's videos inside a feed, the one post elsewhere.
  const openVideo = useCallback(() => {
    if (openInFeed) openInFeed(postId);
    else router.push({ pathname: '/community/videos/[postId]', params: { postId } });
  }, [openInFeed, postId, router]);

  const openPhoto = useCallback(
    (m: PostMediaType) => {
      // Pass the media id rather than an index: the viewer lays its pages out
      // in its own (mirrored under RTL) order.
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
        <Carousel items={ready} onOpenVideo={openVideo} onOpenPhoto={openPhoto} />
      </View>
    );
  }

  const m = ready[0];
  const height = tall && m.kind === 'video' ? REEL_HEIGHT : FEED_HEIGHT;
  return (
    <View className="mt-1" style={{ height }}>
      {m.kind === 'video' ? (
        active ? <AutoplayVideo media={m} onOpen={openVideo} height={height} /> : <VideoThumbnail media={m} onPlay={openVideo} height={height} />
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
  muteButton: {
    position: 'absolute',
    top: 10,
    end: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    position: 'absolute',
    start: 0,
    end: 0,
    bottom: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.darkGold,
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
