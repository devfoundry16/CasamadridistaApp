import React, { useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import type { ViewerPhoto } from '@/types/media/viewerPhoto';
import ZoomablePhoto, { type ViewerContext } from './ZoomablePhoto';

const GAP = 24; // dead space between pages so neighbours never peek during zoom

type Props = {
  photos: ViewerPhoto[]; // already in VISUAL order (reversed under RTL)
  initialIndex: number; // visual index
  pageWidth: number;
  pageHeight: number;
  dragY: SharedValue<number>;
  backdrop: SharedValue<number>;
  onIndexChange: (index: number) => void;
  onToggleChrome: () => void;
  onRequestClose: () => void;
};

export default function PhotoPager({
  photos,
  initialIndex,
  pageWidth,
  pageHeight,
  dragY,
  backdrop,
  onIndexChange,
  onToggleChrome,
  onRequestClose,
}: Props) {
  const stride = pageWidth + GAP;

  // Mounted with the correct offset because the parent keys this component on
  // `${width}x${height}-${photos.length}-${initialIndex}`.
  const pagerX = useSharedValue(-initialIndex * stride);
  const activeIndex = useSharedValue(initialIndex);

  const ctx = useMemo<ViewerContext>(
    () => ({
      pageWidth,
      pageHeight,
      stride,
      count: photos.length,
      pagerX,
      activeIndex,
      dragY,
      backdrop,
      onIndexChange,
      onToggleChrome,
      onRequestClose,
    }),
    [
      pageWidth,
      pageHeight,
      stride,
      photos.length,
      pagerX,
      activeIndex,
      dragY,
      backdrop,
      onIndexChange,
      onToggleChrome,
      onRequestClose,
    ],
  );

  const stripStyle = useAnimatedStyle(() => {
    'worklet';
    return { transform: [{ translateX: pagerX.value }] };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width: photos.length * stride,
          height: pageHeight,
          // The app root sets `direction: 'rtl'` for Arabic (app/_layout.tsx).
          // Pin the strip to LTR so all pager math stays physical; RTL ordering
          // is handled by reversing the array in PhotoViewerScreen.
          direction: 'ltr',
        },
        stripStyle,
      ]}
    >
      {photos.map((photo, i) => (
        <View
          key={photo.id}
          // `left` is a physical edge in Yoga and is NOT flipped by RTL
          // (only `start`/`end` are), so this is deterministic in both locales.
          style={{
            position: 'absolute',
            left: i * stride,
            top: 0,
            width: pageWidth,
            height: pageHeight,
          }}
        >
          <ZoomablePhoto photo={photo} index={i} ctx={ctx} />
        </View>
      ))}
    </Animated.View>
  );
}
