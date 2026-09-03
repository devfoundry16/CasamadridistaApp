import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check, Download, Share2, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  I18nManager,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PhotoPager from '@/components/Community/PhotoViewer/PhotoPager';
import { Text } from '@/components/Text';
import Colors from '@/constants/colors';
import { useMediaItem } from '@/hooks/media/useMediaItem';
import { useDownloadMedia } from '@/hooks/useDownloadMedia';
import type { MediaAsset } from '@/types/media/casaMedia';
import type { ViewerPhoto } from '@/types/media/viewerPhoto';
import { assetFullUri, assetPreviewUri, isViewableMediaPhoto } from '@/utils/mediaUrl';

interface Props {
  itemId: string;
  initialIndex?: number;
}

function toViewerPhoto(asset: MediaAsset): ViewerPhoto {
  return {
    id: asset.id,
    uri: assetFullUri(asset),
    previewUri: assetPreviewUri(asset),
    blurhash: asset.blurhash,
    width: asset.width,
    height: asset.height,
  };
}

/**
 * Full-screen zoom/pager viewer for a Casa Media gallery.
 *
 * Reuses `Community/PhotoViewer/PhotoPager` wholesale — the pager and its
 * gesture maths were generalised to `ViewerPhoto` precisely so this screen did
 * not have to fork them — and the same `useDownloadMedia` save/share path.
 */
export default function MediaViewerScreen({ itemId, initialIndex = 0 }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { data: item, isLoading } = useMediaItem(itemId);
  const { save, status } = useDownloadMedia();

  const photos = useMemo(
    () => (item?.assets ?? []).filter(isViewableMediaPhoto).map(toViewerPhoto),
    [item],
  );

  // RTL mirrors the strip so photo #1 sits on the right; all pager maths stays
  // physical/LTR (see PhotoPager).
  const isRTL = I18nManager.isRTL;
  const visualPhotos = useMemo(
    () => (isRTL ? [...photos].reverse() : photos),
    [photos, isRTL],
  );

  const startIndex = useMemo(() => {
    if (!visualPhotos.length) return 0;
    const clamped = Math.min(Math.max(initialIndex, 0), visualPhotos.length - 1);
    return isRTL ? visualPhotos.length - 1 - clamped : clamped;
  }, [initialIndex, visualPhotos, isRTL]);

  const [index, setIndex] = useState(startIndex);
  useEffect(() => setIndex(startIndex), [startIndex]); // data may arrive late

  const dragY = useSharedValue(0);
  const backdrop = useSharedValue(1);
  const chrome = useSharedValue(1);
  const [chromeVisible, setChromeVisible] = useState(true);

  useEffect(() => {
    chrome.value = withTiming(chromeVisible ? 1 : 0, { duration: 180 });
  }, [chromeVisible, chrome]);

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(`/media/item/${itemId}`);
  }, [router, itemId]);

  // Warm the neighbours so paging is instant.
  useEffect(() => {
    const urls = [visualPhotos[index - 1], visualPhotos[index + 1]]
      .map((photo) => photo?.uri ?? null)
      .filter((uri): uri is string => !!uri);
    if (urls.length) Image.prefetch(urls, { cachePolicy: 'memory-disk' });
  }, [index, visualPhotos]);

  const backdropStyle = useAnimatedStyle(() => {
    'worklet';
    return { opacity: backdrop.value };
  });

  const contentStyle = useAnimatedStyle(() => {
    'worklet';
    const travel = Math.min(Math.abs(dragY.value) / (height * 0.5), 1);
    return { transform: [{ translateY: dragY.value }, { scale: 1 - travel * 0.15 }] };
  });

  const chromeStyle = useAnimatedStyle(() => {
    'worklet';
    return { opacity: chrome.value * backdrop.value };
  });

  const current = visualPhotos[index];
  const logicalIndex = isRTL ? visualPhotos.length - 1 - index : index;

  const handleSave = useCallback(() => {
    if (!current?.uri) {
      Alert.alert(t('common.error'), t('community.photoUnavailable'));
      return;
    }
    void save(current.uri, current);
  }, [current, save, t]);

  const handleShare = useCallback(() => {
    if (current?.uri) void save(current.uri, current, { shareOnly: true });
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
            key={`${width}x${height}-${visualPhotos.length}-${startIndex}`}
            photos={visualPhotos}
            initialIndex={startIndex}
            pageWidth={width}
            pageHeight={height}
            dragY={dragY}
            backdrop={backdrop}
            onIndexChange={setIndex}
            onToggleChrome={() => setChromeVisible((visible) => !visible)}
            onRequestClose={close}
          />
        </Animated.View>
      )}

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

        <View style={styles.iconButton} />
      </Animated.View>

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
