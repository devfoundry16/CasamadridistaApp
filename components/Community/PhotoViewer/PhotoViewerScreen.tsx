import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  I18nManager,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Check, Download, Share2, X } from 'lucide-react-native';
import PostService from '@/services/PostService';
import type { FeedPage, Post, PostMedia } from '@/services/FeedService';
import type { ViewerPhoto } from '@/types/media/viewerPhoto';
import PhotoPager from './PhotoPager';
import { useDownloadMedia } from '@/hooks/useDownloadMedia';
import { fullResUri, isViewablePhoto, previewUri } from '@/utils/media';
import Colors from '@/constants/colors';

type Props = { postId: string; initialMediaId?: string };

/** The viewer speaks ViewerPhoto; the feed speaks PostMedia. Adapt here. */
function toViewerPhoto(media: PostMedia): ViewerPhoto {
  return {
    id: media.id,
    uri: fullResUri(media),
    previewUri: previewUri(media),
    blurhash: media.blurhash,
    width: media.width,
    height: media.height,
  };
}

/**
 * Seed the viewer from whatever is already cached so the photo is on screen on
 * frame 1, then revalidate. `initialDataUpdatedAt: 0` marks the seed as stale
 * so a background refetch always runs (also fixes cold deep-links).
 */
function usePostForViewer(postId: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['post', postId],
    queryFn: () => PostService.getPost(postId),
    enabled: !!postId,
    staleTime: 60_000,
    initialData: (): Post | undefined => {
      const feeds = queryClient.getQueriesData<{ pages: FeedPage[] }>({ queryKey: ['feed'] });
      for (const [, data] of feeds) {
        const hit = data?.pages?.flatMap((page) => page.posts).find((p) => p.id === postId);
        if (hit) return hit;
      }
      return undefined;
    },
    initialDataUpdatedAt: 0,
  });
}

export default function PhotoViewerScreen({ postId, initialMediaId }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { data: post, isLoading } = usePostForViewer(postId);
  const { save, status } = useDownloadMedia();

  const photos = useMemo(() => (post?.media ?? []).filter(isViewablePhoto), [post]);

  // RTL: mirror the strip so photo #1 sits on the right and "next" is to the
  // left, matching Arabic reading order. All pager math below stays LTR.
  const isRTL = I18nManager.isRTL;
  const visualPhotos = useMemo(() => {
    const mapped = photos.map(toViewerPhoto);
    return isRTL ? mapped.reverse() : mapped;
  }, [photos, isRTL]);

  const initialIndex = useMemo(() => {
    if (!visualPhotos.length) return 0;
    const found = initialMediaId ? visualPhotos.findIndex((m) => m.id === initialMediaId) : -1;
    if (found >= 0) return found;
    return isRTL ? visualPhotos.length - 1 : 0; // logical index 0
  }, [initialMediaId, visualPhotos, isRTL]);

  const [index, setIndex] = useState(initialIndex);
  useEffect(() => setIndex(initialIndex), [initialIndex]); // data may arrive late

  const dragY = useSharedValue(0);
  const backdrop = useSharedValue(1);
  const chrome = useSharedValue(1);
  const [chromeVisible, setChromeVisible] = useState(true);

  useEffect(() => {
    chrome.value = withTiming(chromeVisible ? 1 : 0, { duration: 180 });
  }, [chromeVisible, chrome]);

  const toggleChrome = useCallback(() => setChromeVisible((v) => !v), []);

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/community'); // cold deep-link
  }, [router]);

  // Warm the neighbours so paging is instant.
  useEffect(() => {
    const urls = [visualPhotos[index - 1], visualPhotos[index + 1]]
      .map((m) => m?.uri ?? null)
      .filter((u): u is string => !!u);
    if (urls.length) Image.prefetch(urls, { cachePolicy: 'memory-disk' });
  }, [index, visualPhotos]);

  const backdropStyle = useAnimatedStyle(() => {
    'worklet';
    return { opacity: backdrop.value };
  });

  const contentStyle = useAnimatedStyle(() => {
    'worklet';
    const progress = Math.min(Math.abs(dragY.value) / (height * 0.5), 1);
    return { transform: [{ translateY: dragY.value }, { scale: 1 - progress * 0.15 }] };
  });

  const chromeStyle = useAnimatedStyle(() => {
    'worklet';
    return { opacity: chrome.value * backdrop.value };
  });

  const current = visualPhotos[index];
  const logicalIndex = isRTL ? visualPhotos.length - 1 - index : index;

  const handleSave = useCallback(() => {
    if (!current) return;
    const uri = current.uri;
    if (!uri) {
      Alert.alert(t('common.error'), t('community.photoUnavailable'));
      return;
    }
    void save(uri, current);
  }, [current, save, t]);

  const handleShare = useCallback(() => {
    if (!current) return;
    const uri = current.uri;
    if (uri) void save(uri, current, { shareOnly: true });
  }, [current, save]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <StatusBar style="light" />

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, backdropStyle]}
      />

      {!visualPhotos.length ? (
        <View style={styles.centered}>
          {isLoading ? (
            <ActivityIndicator color={Colors.darkGold} size="large" />
          ) : (
            <Text style={styles.emptyText}>{t('community.photoUnavailable')}</Text>
          )}
        </View>
      ) : (
        <Animated.View style={[StyleSheet.absoluteFill, contentStyle]}>
          <PhotoPager
            key={`${width}x${height}-${visualPhotos.length}-${initialIndex}`}
            photos={visualPhotos}
            initialIndex={initialIndex}
            pageWidth={width}
            pageHeight={height}
            dragY={dragY}
            backdrop={backdrop}
            onIndexChange={setIndex}
            onToggleChrome={toggleChrome}
            onRequestClose={close}
          />
        </Animated.View>
      )}

      {/* header */}
      <Animated.View
        pointerEvents={chromeVisible ? 'box-none' : 'none'}
        style={[styles.header, { paddingTop: insets.top + 8 }, chromeStyle]}
      >
        <Pressable
          onPress={close}
          hitSlop={12}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel={t('community.closeViewer')}
        >
          <X size={22} color={Colors.textWhite} />
        </Pressable>

        {visualPhotos.length > 1 && (
          <Text style={styles.counter}>
            {t('community.photoCounter', {
              current: logicalIndex + 1,
              total: visualPhotos.length,
            })}
          </Text>
        )}

        {/* spacer, keeps the counter centred */}
        <View style={styles.iconButton} />
      </Animated.View>

      {/* footer */}
      <Animated.View
        pointerEvents={chromeVisible ? 'box-none' : 'none'}
        style={[styles.footer, { paddingBottom: insets.bottom + 16 }, chromeStyle]}
      >
        <Pressable
          onPress={handleShare}
          hitSlop={12}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel={t('community.sharePhoto')}
        >
          <Share2 size={20} color={Colors.textWhite} />
        </Pressable>

        <Pressable
          onPress={handleSave}
          disabled={status === 'saving' || !current}
          style={[styles.saveButton, status === 'saved' && styles.saveButtonDone]}
          accessibilityRole="button"
          accessibilityLabel={t('community.savePhoto')}
        >
          {status === 'saving' ? (
            <ActivityIndicator color={Colors.textWhite} size="small" />
          ) : status === 'saved' ? (
            <Check size={18} color={Colors.textWhite} />
          ) : (
            <Download size={18} color={Colors.textWhite} />
          )}
          <Text style={styles.saveLabel}>
            {status === 'saving'
              ? t('community.photoSaving')
              : status === 'saved'
                ? t('community.photoSaved')
                : t('community.savePhoto')}
          </Text>
        </Pressable>

        <View style={styles.iconButton} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: Colors.text.tertiary, fontSize: 15 },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  counter: { color: Colors.textWhite, fontSize: 14, fontWeight: '600' },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.darkGold,
    minWidth: 132,
    justifyContent: 'center',
  },
  saveButtonDone: { backgroundColor: Colors.status.success },
  saveLabel: { color: Colors.textWhite, fontSize: 14, fontWeight: '700' },
});
