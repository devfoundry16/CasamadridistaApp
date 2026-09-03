import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  I18nManager,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import EngagementBar from '@/components/Media/EngagementBar';
import GalleryGrid from '@/components/Media/GalleryGrid';
import LockedOverlay from '@/components/Media/LockedOverlay';
import MediaCover from '@/components/Media/MediaCover';
import { relativeTime } from '@/components/Media/time';
import MediaVideoPlayer from '@/components/Media/Video/MediaVideoPlayer';
import ErrorState from '@/components/Team/ErrorState';
import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { useMediaItem, useMediaPlayback } from '@/hooks/media/useMediaItem';
import AnalyticsService from '@/services/AnalyticsService';
import CasaMediaService from '@/services/CasaMediaService';
import { isPlayableVideo, isViewableMediaPhoto } from '@/utils/mediaUrl';

/**
 * A single media item: video, photo or gallery.
 *
 * `headerShown: false` (declared in `app/_layout.tsx`) — the cover is
 * full-bleed and a native header would sit on top of it, so the back affordance
 * floats over the media instead.
 */
export default function MediaItemScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id, c: campaignId } = useLocalSearchParams<{ id: string; c?: string }>();

  const { data: item, isLoading, isError, refetch } = useMediaItem(id);

  // Fresh signed URLs, but only for content this viewer may actually play.
  const wantsPlayback = !!item && !item.locked && item.type === 'video';
  const { data: playback } = useMediaPlayback(id, wantsPlayback);

  useEffect(() => {
    if (!item || item.locked) return;
    AnalyticsService.track('item_view', {
      item_id: item.id,
      match_id: item.match_id ?? undefined,
      campaign_id: campaignId,
    });
    void CasaMediaService.recordViews([item.id]);
  }, [item, campaignId]);

  const openViewer = useCallback(
    (index: number) =>
      router.push({
        pathname: '/media/viewer/[id]',
        params: { id: String(id), index: String(index) },
      }),
    [router, id],
  );

  if (isLoading) {
    return (
      <View style={centered}>
        <ActivityIndicator size="large" color={Colors.darkGold} />
      </View>
    );
  }

  if (isError || !item) {
    return (
      <View style={centered}>
        <ErrorState title={t('casaMedia.loadFailed')} onRetry={refetch} />
      </View>
    );
  }

  const coverHeight = Math.round(width * (9 / 16));
  // A locked item is served as a *teaser*, which has no `assets` key at all —
  // the normaliser fills in `[]`, and this fallback covers a cache entry seeded
  // from an older payload. Nothing below may assume the array exists.
  const assets = item.assets ?? [];
  const videoAsset = item.locked ? undefined : assets.find(isPlayableVideo);
  const playbackAsset = playback?.assets.find((asset) => asset.id === videoAsset?.id);
  const videoUri = playbackAsset?.hls_url ?? playbackAsset?.url ?? videoAsset?.hls_url ?? videoAsset?.url;
  const photos = item.locked ? [] : assets.filter(isViewableMediaPhoto);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View>
          {!item.locked && videoUri ? (
            <MediaVideoPlayer itemId={item.id} uri={videoUri} height={coverHeight} />
          ) : (
            <MediaCover item={item} width={width} height={coverHeight} radius={0} />
          )}
          {item.locked ? <LockedOverlay item={item} variant="full" /> : null}
        </View>

        <View style={{ padding: 16 }}>
          <Text className="text-[19px] font-bold" style={{ color: Colors.text.primary }}>
            {item.title ?? ''}
          </Text>
          <Text className="text-[11px]" style={{ color: Colors.text.tertiary, marginTop: 6 }}>
            {[item.category?.name, item.contributor?.display_name, relativeTime(item.published_at)]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          {item.description ? (
            <Text
              className="text-[14px] leading-6"
              style={{ color: Colors.text.secondary, marginTop: 12 }}
            >
              {item.description}
            </Text>
          ) : null}
        </View>

        <EngagementBar item={item} />

        {!item.locked && photos.length > 0 ? (
          <View style={{ marginTop: 16 }}>
            <GalleryGrid assets={photos} onPressAsset={openViewer} />
          </View>
        ) : null}
      </ScrollView>

      <Touchable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/media'))}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        style={({ pressed }) => ({
          position: 'absolute',
          top: insets.top + 6,
          // `start`, not `left`: the back affordance mirrors under RTL.
          start: 10,
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        {/* The glyph itself has a direction; `start` only mirrors its position. */}
        {I18nManager.isRTL ? (
          <ChevronRight size={22} color={Colors.textWhite} />
        ) : (
          <ChevronLeft size={22} color={Colors.textWhite} />
        )}
      </Touchable>
    </View>
  );
}

const centered = {
  flex: 1,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  backgroundColor: Colors.background.deepDark,
};
