import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Maximize2, Pause, Play } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import AnalyticsService from '@/services/AnalyticsService';

interface Props {
  itemId: string;
  /** HLS manifest (preferred) or a progressive MP4. */
  uri: string;
  posterUri?: string | null;
  /** 16:9 by default; stories pass the full screen height. */
  height: number;
  autoPlay?: boolean;
  /**
   * Externally-driven pause (the story viewer's hold-to-pause). Left undefined
   * the player is only controlled by its own play/pause button.
   */
  paused?: boolean;
}

/** Quartiles are what the content team reports on — nothing finer is stored. */
const MILESTONES = [25, 50, 75, 100] as const;

/**
 * The Casa Media video surface.
 *
 * Custom controls rather than `nativeControls` for two reasons: the native bar
 * cannot be themed, and quartile analytics need a `timeUpdate` subscription we
 * own. Exactly one `VideoView` is mounted per screen (plan §5.8) — lists show
 * posters only. Adaptive quality is HLS's job, so there is no quality selector.
 */
export default function MediaVideoPlayer({
  itemId,
  uri,
  posterUri,
  height,
  autoPlay = false,
  paused,
}: Props) {
  const { t } = useTranslation();
  const viewRef = useRef<VideoView>(null);
  const reported = useRef<Set<number>>(new Set());
  const unlockedOrientation = useRef(false);
  const [playing, setPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);

  const source: VideoSource = { uri };

  const player = useVideoPlayer(source, (instance) => {
    instance.loop = false;
    instance.timeUpdateEventInterval = 1;
    if (autoPlay) instance.play();
  });

  // One item's quartiles must not suppress the next one's. The ref survives a
  // source swap (the story viewer reuses this component across stories), so it
  // has to be cleared explicitly rather than relying on remount.
  useEffect(() => {
    reported.current.clear();
    setCurrentTime(0);
  }, [itemId]);

  // Milestones + the clock both ride on one subscription.
  useEffect(() => {
    const timeSub = player.addListener('timeUpdate', ({ currentTime: time }) => {
      setCurrentTime(time);
      const total = player.duration;
      if (!total || total <= 0) return;
      setDuration(total);
      const percent = (time / total) * 100;
      for (const milestone of MILESTONES) {
        if (percent + 0.5 >= milestone && !reported.current.has(milestone)) {
          reported.current.add(milestone);
          AnalyticsService.track('video_progress', {
            item_id: itemId,
            props: { percent: milestone },
          });
        }
      }
    });

    const statusSub = player.addListener('statusChange', () => {
      if (player.duration > 0) setDuration(player.duration);
    });

    const endSub = player.addListener('playToEnd', () => {
      setPlaying(false);
      if (!reported.current.has(100)) {
        reported.current.add(100);
        AnalyticsService.track('video_progress', { item_id: itemId, props: { percent: 100 } });
      }
    });

    return () => {
      timeSub.remove();
      statusSub.remove();
      endSub.remove();
    };
  }, [player, itemId]);

  // Honour an external pause request (story hold-to-pause) without fighting the
  // in-player button: only acts when `paused` is explicitly provided.
  useEffect(() => {
    if (paused === undefined) return;
    if (paused) {
      player.pause();
      setPlaying(false);
    } else {
      player.play();
      setPlaying(true);
    }
  }, [paused, player]);

  const togglePlay = useCallback(() => {
    if (player.playing) {
      player.pause();
      setPlaying(false);
    } else {
      player.play();
      setPlaying(true);
    }
  }, [player]);

  const seekToFraction = useCallback(
    (fraction: number) => {
      const total = duration || player.duration;
      if (!total || total <= 0) return;
      const clamped = Math.min(1, Math.max(0, fraction));
      player.currentTime = clamped * total;
      setCurrentTime(clamped * total);
    },
    [duration, player],
  );

  // Tap-and-drag anywhere on the track seeks. minDistance(0) so a plain tap
  // registers too — a 3px-tall bar is hard enough to hit without a drag threshold.
  const scrub = Gesture.Pan()
    .minDistance(0)
    .onBegin((event) => {
      'worklet';
      if (trackWidth > 0) runOnJS(seekToFraction)(event.x / trackWidth);
    })
    .onUpdate((event) => {
      'worklet';
      if (trackWidth > 0) runOnJS(seekToFraction)(event.x / trackWidth);
    });

  const handleFullscreen = useCallback(async () => {
    try {
      await viewRef.current?.enterFullscreen();
    } catch {
      // Fullscreen is unavailable on some Android surfaces; not fatal.
    }
  }, []);

  // Restore the portrait lock on unmount, but ONLY if this player is the one
  // that unlocked it. Calling lockAsync unconditionally would impose a lock the
  // app never asked for — the app declares `orientation: 'portrait'` in
  // app.json and otherwise leaves orientation alone.
  useEffect(() => {
    return () => {
      if (!unlockedOrientation.current) return;
      unlockedOrientation.current = false;
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    };
  }, []);

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return (
    <View style={{ height, backgroundColor: '#000' }}>
      <VideoView
        ref={viewRef}
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls={false}
        allowsFullscreen
        allowsPictureInPicture={false}
        onFullscreenEnter={() => {
          unlockedOrientation.current = true;
          ScreenOrientation.unlockAsync().catch(() => {});
        }}
        onFullscreenExit={() => {
          unlockedOrientation.current = false;
          ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(
            () => {},
          );
        }}
        accessibilityLabel={posterUri ? undefined : t('casaMedia.video')}
      />

      <View style={styles.controls} pointerEvents="box-none">
        <Touchable
          onPress={togglePlay}
          accessibilityRole="button"
          accessibilityLabel={playing ? t('casaMedia.pause') : t('casaMedia.play')}
          hitSlop={10}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, padding: 4 })}
        >
          {playing ? (
            <Pause size={18} color={Colors.textWhite} fill={Colors.textWhite} />
          ) : (
            <Play size={18} color={Colors.textWhite} fill={Colors.textWhite} />
          )}
        </Touchable>

        {/*
          Pinned to LTR. Under Arabic the app root sets direction: 'rtl', which
          would otherwise put 0:00 on the right and run the fill backwards —
          a seek bar is a physical timeline, not text.
        */}
        <View style={styles.trackWrap} onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}>
          <GestureDetector gesture={scrub}>
            <View style={styles.trackHit} collapsable={false}>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${progress * 100}%` }]} />
              </View>
            </View>
          </GestureDetector>
        </View>

        <Text style={styles.clock}>
          {formatClock(currentTime)} / {formatClock(duration)}
        </Text>

        <Touchable
          onPress={handleFullscreen}
          accessibilityRole="button"
          accessibilityLabel={t('casaMedia.fullscreen')}
          hitSlop={10}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, padding: 4 })}
        >
          <Maximize2 size={16} color={Colors.textWhite} />
        </Touchable>
      </View>
    </View>
  );
}

function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    direction: 'ltr',
  },
  trackWrap: { flex: 1 },
  trackHit: { height: 24, justifyContent: 'center' },
  track: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden',
  },
  fill: { height: 3, backgroundColor: Colors.darkGold },
  clock: {
    color: Colors.textWhite,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    writingDirection: 'ltr',
  },
});
