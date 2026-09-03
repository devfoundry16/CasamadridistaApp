import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import Colors from '@/constants/colors';

interface Props {
  count: number;
  activeIndex: number;
  /** 0→1 for the active segment only. Owned by the viewer. */
  progress: SharedValue<number>;
}

/**
 * The segmented progress strip at the top of a story.
 *
 * Pinned to `direction: 'ltr'`: the strip is a timeline, and under Arabic the
 * root's RTL direction would otherwise reverse the segment order so the first
 * story appeared to be the last one.
 */
export default function StoryProgressBars({ count, activeIndex, progress }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }, (_, index) => (
        <Segment
          key={index}
          state={index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'todo'}
          progress={progress}
        />
      ))}
    </View>
  );
}

function Segment({
  state,
  progress,
}: {
  state: 'done' | 'active' | 'todo';
  progress: SharedValue<number>;
}) {
  const fillStyle = useAnimatedStyle(() => {
    'worklet';
    const value = state === 'done' ? 1 : state === 'active' ? progress.value : 0;
    return { width: `${Math.min(100, Math.max(0, value * 100))}%` };
  });

  return (
    <View style={styles.segment}>
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, direction: 'ltr' },
  segment: {
    flex: 1,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  fill: { height: 2.5, backgroundColor: Colors.textWhite },
});
