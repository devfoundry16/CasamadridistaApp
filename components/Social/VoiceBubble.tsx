import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Pause, Play } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { formatDuration, nextRate } from '@/utils/chat.core';
import T from './T';

interface Props {
  /** The signed URL, or the local file while it uploads. */
  uri: string | null;
  durationMs: number | null;
  /** Mine: dark glyphs on gold. */
  mine: boolean;
}

/**
 * A voice note: play/pause, a progress bar, the time, and 1× → 1.5× → 2×.
 * Separate from Casa Arena's live voice by design: a recording, not a call.
 */
export default function VoiceBubble({ uri, durationMs, mine }: Props) {
  const { t } = useTranslation();
  const player = useAudioPlayer(uri ? { uri } : null, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const [rate, setRate] = useState(1);
  const fg = mine ? Colors.text.dark : Colors.text.primary;
  const track = mine ? 'rgba(26,26,26,0.25)' : Colors.border.light;

  const totalMs = status.duration > 0 ? status.duration * 1000 : durationMs ?? 0;
  const atMs = status.currentTime * 1000;
  const progress = totalMs > 0 ? Math.min(1, atMs / totalMs) : 0;

  // At the end, wind back so the next tap plays from the start.
  useEffect(() => {
    if (status.didJustFinish) void player.seekTo(0);
  }, [status.didJustFinish, player]);

  const toggle = async () => {
    if (!uri) return;
    if (status.playing) {
      player.pause();
      return;
    }
    // Play through the speaker even with the ringer switch off.
    await setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    player.play();
  };

  const cycleRate = () => {
    const next = nextRate(rate);
    setRate(next);
    player.setPlaybackRate(next);
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 8, width: 232 }}>
      <Touchable
        onPress={toggle}
        disabled={!uri}
        accessibilityRole="button"
        accessibilityLabel={status.playing ? t('social.voice.pause') : t('social.voice.play')}
        hitSlop={6}
        style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: mine ? Colors.text.dark : Colors.darkGold }}
      >
        {status.playing ? (
          <Pause size={16} color={mine ? Colors.darkGold : Colors.text.dark} fill={mine ? Colors.darkGold : Colors.text.dark} />
        ) : (
          <Play size={16} color={mine ? Colors.darkGold : Colors.text.dark} fill={mine ? Colors.darkGold : Colors.text.dark} />
        )}
      </Touchable>
      <View style={{ flex: 1, gap: 4 }}>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
          style={{ height: 4, borderRadius: 2, backgroundColor: track, overflow: 'hidden' }}
        >
          <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: fg }} />
        </View>
        <T step="caption" color={fg} ltr>
          {formatDuration(status.playing || atMs > 0 ? atMs : totalMs)}
        </T>
      </View>
      <Touchable
        onPress={cycleRate}
        accessibilityRole="button"
        accessibilityLabel={t('social.voice.speed', { rate })}
        hitSlop={6}
        style={{ minWidth: 38, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: track, alignItems: 'center' }}
      >
        <T step="caption" weight="semibold" color={fg} ltr>
          {`${rate}×`}
        </T>
      </Touchable>
    </View>
  );
}
