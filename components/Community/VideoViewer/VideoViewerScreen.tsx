import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView, type VideoPlayer } from 'expo-video';
import { Volume2, VolumeX, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, AppState, FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PostActions from '@/components/Community/PostCard/PostActions';
import PostBody from '@/components/Community/PostCard/PostBody';
import PostHeader from '@/components/Community/PostCard/PostHeader';
import { feedMutedNow, useFeedMuted } from '@/components/Community/FeedPlayback';
import Colors from '@/constants/colors';
import FeedService, { type Post } from '@/services/FeedService';
import PostService from '@/services/PostService';
import { playableUri, videoPostsOf, viewerIndex, type FeedTabName } from '@/utils/feedAutoplay.core';
import { videoProgress } from '@/utils/stories.core';

interface Props {
  postId: string;
  /** The feed whose videos to page through; null opens the one post. */
  feed: FeedTabName | null;
}

/**
 * Full-screen vertical video: one post per screen, swipe up for the next.
 *
 * Opened from a feed, it pages through that feed's ready videos, reading the
 * feed's own infinite query (same key and fetcher as FeedList): nothing is
 * fetched twice, and more pages load near the end. It never refetches the
 * pages on open, and it tracks the open video by id, so a reordered feed
 * cannot swap the video under the viewer. Opened anywhere else, or cold from
 * a link, it shows the one post.
 *
 * One player for the whole viewer (plan §5.8): its source is swapped when the
 * page changes, and the other pages show their poster.
 *
 * Presented as an ordinary screen (sliding up), not a modal: a hashtag,
 * mention or profile tapped here must open on top of it, and on iOS a screen
 * pushed from a full-screen modal opens behind it.
 */
export default function VideoViewerScreen({ postId, feed }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const [muted, toggleMuted] = useFeedMuted();

  const feedQuery = useInfiniteQuery({
    queryKey: ['feed', feed],
    queryFn: ({ pageParam }) => FeedService.getFeed(feed ?? 'for-you', pageParam ?? null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
    // Read the list's pages as they are: a refetch could reorder them.
    refetchOnMount: false,
    enabled: feed !== null,
  });
  const fromFeed = useMemo(() => videoPostsOf(feedQuery.data?.pages), [feedQuery.data]);
  const inFeed = fromFeed.some((p) => p.id === postId);

  // The one post, when there is no feed or the feed does not hold it.
  const single = useQuery({
    queryKey: ['post', postId],
    queryFn: () => PostService.getPost(postId),
    enabled: !!postId && (feed === null || (feedQuery.isFetched && !inFeed)),
  });

  const videos: Post[] = useMemo(() => {
    if (inFeed) return fromFeed;
    return single.data ? videoPostsOf([{ posts: [single.data] }]) : [];
  }, [inFeed, fromFeed, single.data]);

  const [currentId, setCurrentId] = useState(postId);
  const index = viewerIndex(videos, currentId);
  const current = index >= 0 ? videos[index] : undefined;

  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const player = useVideoPlayer(null, (p) => {
    p.loop = true;
    p.muted = feedMutedNow();
    p.timeUpdateEventInterval = 0.25;
  });

  // A new page: stop the old video, swap the one player's source, and play
  // unless the viewer was paused meanwhile. Until the new source has loaded,
  // the page keeps its poster, so the previous video never shows under it.
  const currentUri = current?.media?.[0] ? playableUri(current.media[0]) : null;
  const [loadedUri, setLoadedUri] = useState<string | null>(null);
  useEffect(() => {
    if (!currentUri) return;
    let stale = false;
    player.pause();
    setPaused(false);
    void player.replaceAsync({ uri: currentUri }).then(() => {
      if (stale) return;
      setLoadedUri(currentUri);
      if (!pausedRef.current) player.play();
    });
    return () => {
      stale = true;
    };
  }, [player, currentUri]);

  useEffect(() => {
    player.muted = muted;
  }, [player, muted]);

  useEffect(() => {
    if (loadedUri !== currentUri) return;
    if (paused) player.pause();
    else player.play();
  }, [player, paused, loadedUri, currentUri]);

  // Going to the background pauses; coming back leaves it paused for a tap.
  // Not on iOS's brief "inactive" (Control Center, a call banner).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') setPaused(true);
    });
    return () => sub.remove();
  }, []);

  // Near the end of the loaded videos, load the next page of the feed.
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feedQuery;
  useEffect(() => {
    if (inFeed && index >= videos.length - 2 && hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [inFeed, index, videos.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  // A person opens their profile. A fan club post has no personal profile
  // behind it (its author_id is the club admin), so it opens the post, as in
  // PostCard.
  const openAuthor = useCallback(
    (post: Post) => {
      if (post.author_type === 'user' && post.author_id) router.push(`/user/${post.author_id}`);
      else router.push(`/community/post/${post.id}`);
    },
    [router],
  );

  const loading = (feed !== null && feedQuery.isPending) || (!inFeed && single.isPending && single.fetchStatus !== 'idle');
  if (!current) {
    return (
      <View style={[styles.fill, styles.center]}>
        {loading ? <ActivityIndicator color={Colors.darkGold} /> : null}
        <Pressable onPress={close} accessibilityRole="button" accessibilityLabel={t('video.close')} style={[styles.round, { position: 'absolute', top: insets.top + 8, start: 12 }]}>
          <X size={22} color="#fff" />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <StatusBar style="light" />
      <FlatList
        data={videos}
        keyExtractor={(p) => p.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        initialScrollIndex={index}
        getItemLayout={(_, i) => ({ length: height, offset: height * i, index: i })}
        windowSize={3}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        onMomentumScrollEnd={(e) => {
          const id = videos[Math.round(e.nativeEvent.contentOffset.y / height)]?.id;
          if (id && id !== currentId) setCurrentId(id);
        }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setPaused((p) => !p)}
            style={{ width, height, backgroundColor: '#000' }}
            accessibilityRole="button"
            accessibilityLabel={paused ? t('video.play') : t('video.pause')}
          >
            {item.id === current.id ? (
              <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} />
            ) : null}
            {item.id !== current.id || loadedUri !== currentUri ? (
              <Image
                source={{ uri: item.media[0]?.thumbnail_url ?? undefined }}
                placeholder={item.media[0]?.blurhash ?? undefined}
                style={StyleSheet.absoluteFill}
                contentFit="contain"
              />
            ) : null}
            <View style={[styles.bottom, { paddingBottom: insets.bottom + 8 }]}>
              <PostHeader post={item} onAuthorPress={() => openAuthor(item)} />
              <PostBody post={item} truncate />
              <PostActions post={item} onCommentPress={() => router.push(`/community/post/${item.id}`)} />
            </View>
          </Pressable>
        )}
      />

      <ViewerProgress player={player} bottom={insets.bottom} />

      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <Pressable onPress={close} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('video.close')} style={styles.round}>
          <X size={22} color="#fff" />
        </Pressable>
        <Pressable
          onPress={toggleMuted}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={muted ? t('video.unmute') : t('video.mute')}
          style={styles.round}
        >
          {muted ? <VolumeX size={20} color="#fff" /> : <Volume2 size={20} color="#fff" />}
        </Pressable>
      </View>
    </View>
  );
}

/**
 * The progress bar keeps its own state, so the player's four updates a second
 * re-render the bar, not the pages and their post components.
 */
function ViewerProgress({ player, bottom }: { player: VideoPlayer; bottom: number }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const time = player.addListener('timeUpdate', ({ currentTime }) => setProgress(videoProgress(currentTime, player.duration)));
    const source = player.addListener('sourceChange', () => setProgress(0));
    return () => {
      time.remove();
      source.remove();
    };
  }, [player]);
  return (
    <View style={[styles.progressTrack, { bottom }]}>
      <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center' },
  topBar: {
    position: 'absolute',
    start: 12,
    end: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  round: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    position: 'absolute',
    start: 0,
    end: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  progressTrack: {
    position: 'absolute',
    start: 0,
    end: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  progressFill: { height: 3, backgroundColor: Colors.darkGold },
});
