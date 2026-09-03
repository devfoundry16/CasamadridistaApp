import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Flag, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { I18nManager, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import AnalyticsService from '@/services/AnalyticsService';
import CasaMediaService from '@/services/CasaMediaService';
import type { MediaItem, MediaStoryGroup } from '@/types/media/casaMedia';
import { assetFullUri, isPlayableVideo, sizedUri } from '@/utils/mediaUrl';
import LockedOverlay from '../LockedOverlay';
import MediaReportSheet from '../MediaReportSheet';
import MediaVideoPlayer from '../Video/MediaVideoPlayer';
import StoryProgressBars from './StoryProgressBars';
import StoryReactions from './StoryReactions';
import StoryReplyBar from './StoryReplyBar';

interface Props {
  groups: MediaStoryGroup[];
  initialGroupId?: string;
}

/** Stills hold for 5s; a video runs for its own duration. */
const PHOTO_DURATION_MS = 5_000;
const SWIPE_DISMISS_PX = 110;
const SWIPE_GROUP_PX = 70;

/**
 * Full-screen story viewer.
 *
 * Built on the same physical-layout discipline as `PhotoViewer/PhotoPager`: the
 * strip and the tap zones are reasoned about in physical left/right, and RTL is
 * handled by *swapping which zone means "next"* rather than by letting Yoga flip
 * the layout underneath the gesture maths. Only the current story is mounted, so
 * there is never more than one `VideoView` alive (plan §5.8).
 */
export default function StoryViewer({ groups, initialGroupId }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const startIndex = useMemo(() => {
    const found = groups.findIndex((group) => group.id === initialGroupId);
    return found >= 0 ? found : 0;
  }, [groups, initialGroupId]);

  const [groupIndex, setGroupIndex] = useState(startIndex);
  const [itemIndex, setItemIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const progress = useSharedValue(0);
  const viewedItems = useRef<Set<string>>(new Set());

  const group: MediaStoryGroup | undefined = groups[groupIndex];
  const item: MediaItem | undefined = group?.items[itemIndex];

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/media');
  }, [router]);

  /* ------------------------- navigation ------------------------- */

  // Both of these read the current indices from the render closure rather than
  // from a state updater. A `setItemIndex(prev => ...)` callback must be pure —
  // React may invoke it more than once — and these branches also have to call
  // `setGroupIndex` / `close()`, which are exactly the side effects an updater
  // is not allowed to perform.
  const goNext = useCallback(() => {
    const total = groups[groupIndex]?.items.length ?? 0;
    if (itemIndex + 1 < total) {
      setItemIndex(itemIndex + 1);
      return;
    }
    // End of the group: advance to the next one, or leave.
    if (groupIndex + 1 < groups.length) {
      setGroupIndex(groupIndex + 1);
      setItemIndex(0);
      return;
    }
    close();
  }, [groupIndex, itemIndex, groups, close]);

  const goPrevious = useCallback(() => {
    if (itemIndex > 0) {
      setItemIndex(itemIndex - 1);
      return;
    }
    if (groupIndex > 0) {
      const previous = groupIndex - 1;
      setGroupIndex(previous);
      setItemIndex(Math.max(0, (groups[previous]?.items.length ?? 1) - 1));
    }
  }, [groupIndex, itemIndex, groups]);

  const goNextGroup = useCallback(() => {
    if (groupIndex + 1 >= groups.length) {
      close();
      return;
    }
    setGroupIndex(groupIndex + 1);
    setItemIndex(0);
  }, [groupIndex, groups.length, close]);

  const goPreviousGroup = useCallback(() => {
    if (groupIndex === 0) {
      setItemIndex(0);
      return;
    }
    setGroupIndex(groupIndex - 1);
    setItemIndex(0);
  }, [groupIndex]);

  /* --------------------------- timer ---------------------------- */

  const durationMs = item?.duration_ms && item.duration_ms > 0 ? item.duration_ms : PHOTO_DURATION_MS;
  const itemId = item?.id;

  // `goNext` changes identity whenever an index does, and the timer effect must
  // not restart just because of that. Read it through a ref so the effect's only
  // real dependencies are the item, its duration and the paused flag.
  const goNextRef = useRef(goNext);
  useEffect(() => {
    goNextRef.current = goNext;
  }, [goNext]);
  const advance = useCallback(() => goNextRef.current(), []);

  // Rewind only when the story itself changes.
  useEffect(() => {
    if (!itemId) return;
    cancelAnimation(progress);
    progress.value = 0;
  }, [itemId, progress]);

  // Run or freeze the bar. `cancelAnimation` leaves `progress.value` wherever it
  // got to, so resuming is a shorter timing to the same target — a hold-to-pause
  // that restarted the segment would make a long story unreadable.
  useEffect(() => {
    if (!itemId) return;
    if (paused) {
      cancelAnimation(progress);
      return;
    }

    const remaining = Math.max(1, durationMs * (1 - progress.value));
    progress.value = withTiming(1, { duration: remaining }, (finished) => {
      'worklet';
      if (finished) runOnJS(advance)();
    });

    return () => cancelAnimation(progress);
  }, [itemId, durationMs, paused, progress, advance]);

  /* --------------------------- effects -------------------------- */

  // Count the view once per item, and prefetch the next still so paging is instant.
  useEffect(() => {
    if (!item) return;
    if (!viewedItems.current.has(item.id)) {
      viewedItems.current.add(item.id);
      void CasaMediaService.storyView(item.id);
      AnalyticsService.track('story_view', {
        item_id: item.id,
        match_id: item.match_id ?? undefined,
      });
    }

    const next = group?.items[itemIndex + 1] ?? groups[groupIndex + 1]?.items[0];
    const nextUri = next ? sizedUri(next.cover_url, width) : null;
    if (nextUri) Image.prefetch([nextUri], { cachePolicy: 'memory-disk' });
  }, [item, group, groups, groupIndex, itemIndex, width]);

  /* -------------------------- gestures -------------------------- */

  // RTL swaps which physical half means "next": Arabic readers page right-to-left.
  const isRTL = I18nManager.isRTL;

  const tap = Gesture.Tap()
    .maxDuration(250)
    .onEnd((event, success) => {
      'worklet';
      if (!success) return;
      const leftHalf = event.x < width * 0.35;
      const forward = isRTL ? leftHalf : !leftHalf;
      if (forward) runOnJS(goNext)();
      else runOnJS(goPrevious)();
    });

  // Hold to pause — the standard story affordance for "let me read this".
  const hold = Gesture.LongPress()
    .minDuration(220)
    .onStart(() => {
      'worklet';
      runOnJS(setPaused)(true);
    })
    .onFinalize(() => {
      'worklet';
      runOnJS(setPaused)(false);
    });

  const swipe = Gesture.Pan()
    .minDistance(12)
    .onEnd((event) => {
      'worklet';
      if (event.translationY > SWIPE_DISMISS_PX) {
        runOnJS(close)();
        return;
      }
      if (Math.abs(event.translationX) < SWIPE_GROUP_PX) return;
      // Physical drag direction, flipped for RTL for the same reason as taps.
      const draggedLeft = event.translationX < 0;
      const forward = isRTL ? !draggedLeft : draggedLeft;
      if (forward) runOnJS(goNextGroup)();
      else runOnJS(goPreviousGroup)();
    });

  const gesture = Gesture.Race(swipe, Gesture.Exclusive(hold, tap));

  if (!group || !item) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.empty]}>
        <StatusBar style="light" />
        <Text style={{ color: Colors.text.tertiary }}>{t('casaMedia.storyUnavailable')}</Text>
      </View>
    );
  }

  // A locked story is a teaser: no `assets` key on the wire at all. The cover is
  // the only thing there is to show, and it is all the viewer is entitled to.
  const assets = item.locked ? [] : (item.assets ?? []);
  const videoAsset = assets.find(isPlayableVideo);
  const stillUri = assets.map(assetFullUri).find(Boolean) ?? sizedUri(item.cover_url, width);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]}>
      <StatusBar style="light" />

      <GestureDetector gesture={gesture}>
        <Animated.View style={StyleSheet.absoluteFill} collapsable={false}>
          {videoAsset && !item.locked ? (
            <MediaVideoPlayer
              itemId={item.id}
              uri={(videoAsset.hls_url ?? videoAsset.url)!}
              height={height}
              autoPlay
              paused={paused}
            />
          ) : (
            <Image
              source={stillUri ? { uri: stillUri } : undefined}
              placeholder={item.cover_blurhash ?? undefined}
              placeholderContentFit="cover"
              style={StyleSheet.absoluteFill}
              contentFit="contain"
              transition={140}
              cachePolicy="memory-disk"
              recyclingKey={item.id}
              accessibilityIgnoresInvertColors
            />
          )}

          {item.locked ? <LockedOverlay item={item} variant="full" /> : null}
        </Animated.View>
      </GestureDetector>

      {/* header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <StoryProgressBars
          count={group.items.length}
          activeIndex={itemIndex}
          progress={progress}
        />
        <View style={styles.headerRow}>
          <Text
            className="text-[13px] font-semibold"
            style={{ flex: 1, color: Colors.textWhite }}
            numberOfLines={1}
          >
            {item.title ?? group.title ?? ''}
          </Text>
          <Touchable
            onPress={() => setReportOpen(true)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('casaMedia.report')}
            style={{ padding: 6 }}
          >
            <Flag size={17} color={Colors.textWhite} />
          </Touchable>
          <Touchable
            onPress={close}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('community.closeViewer')}
            style={{ padding: 6, marginStart: 4 }}
          >
            <X size={20} color={Colors.textWhite} />
          </Touchable>
        </View>
      </View>

      {/* footer */}
      {!item.locked ? (
        <View
          style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}
          pointerEvents="box-none"
        >
          <StoryReactions itemId={item.id} onInteract={() => setPaused(false)} />
          <View style={{ height: 10 }} />
          <StoryReplyBar
            itemId={item.id}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          />
        </View>
      ) : null}

      <MediaReportSheet
        visible={reportOpen}
        itemId={item.id}
        onClose={() => setReportOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  header: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  footer: {
    position: 'absolute',
    bottom: 0,
    start: 0,
    end: 0,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
});
