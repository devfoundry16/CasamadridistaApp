import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image, type ImageLoadEventData } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { ViewerPhoto } from '@/types/media/viewerPhoto';
import { fitInBox } from '@/utils/media';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const PINCH_OVERSHOOT = 1.35; // allow rubbery over/under-zoom, snap back on release
const ZOOMED_EPSILON = 1.02;
const DECIDE_THRESHOLD = 6; // px before we lock the pan axis
const PAGE_TRIGGER_RATIO = 0.25;
const PAGE_TRIGGER_VELOCITY = 600;
const DISMISS_DISTANCE = 110;
const DISMISS_VELOCITY = 900;

const SPRING = { damping: 22, stiffness: 220, mass: 0.6 } as const;
const PAGE_SPRING = { damping: 30, stiffness: 260, mass: 0.7, overshootClamping: true } as const;

// Pan intent, resolved once per gesture.
const NONE = 0;
const PAGE = 1;
const DISMISS = 2;
const IMAGE = 3;

export type ViewerContext = {
  pageWidth: number;
  pageHeight: number;
  stride: number; // pageWidth + gap
  count: number;
  pagerX: SharedValue<number>;
  activeIndex: SharedValue<number>;
  dragY: SharedValue<number>;
  backdrop: SharedValue<number>;
  onIndexChange: (index: number) => void;
  onToggleChrome: () => void;
  onRequestClose: () => void;
};

/* ------------------------------------------------------------------ *
 * Module-scope worklets. Deliberately NOT closures inside the
 * component: react-compiler runs before the worklets babel plugin
 * (babel-preset-expo), and module-scope functions with an explicit
 * 'worklet' directive are immune to any memo-hoisting the compiler does.
 * ------------------------------------------------------------------ */

function maxOffset(displayed: number, box: number, scale: number) {
  'worklet';
  return Math.max(0, (displayed * scale - box) / 2);
}

function springReset(
  scale: SharedValue<number>,
  tx: SharedValue<number>,
  ty: SharedValue<number>,
) {
  'worklet';
  scale.value = withSpring(MIN_SCALE, SPRING);
  tx.value = withSpring(0, SPRING);
  ty.value = withSpring(0, SPRING);
}

function timedReset(
  scale: SharedValue<number>,
  tx: SharedValue<number>,
  ty: SharedValue<number>,
) {
  'worklet';
  scale.value = withTiming(MIN_SCALE, { duration: 160 });
  tx.value = withTiming(0, { duration: 160 });
  ty.value = withTiming(0, { duration: 160 });
}

type Props = {
  photo: ViewerPhoto;
  index: number;
  ctx: ViewerContext;
};

export default function ZoomablePhoto({ photo, index, ctx }: Props) {
  // Destructure so worklets capture individual shared values instead of the
  // whole context object (smaller shareable clones, no captured JS methods).
  const { pageWidth, pageHeight, stride, count, pagerX, activeIndex, dragY, backdrop } = ctx;
  const { onIndexChange, onToggleChrome, onRequestClose } = ctx;

  const scale = useSharedValue(MIN_SCALE);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  const startScale = useSharedValue(MIN_SCALE);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const pagerStart = useSharedValue(0);
  const intent = useSharedValue(NONE);

  // Displayed (contain-fitted) size at scale 1 — the basis of every pan bound.
  const [boxSize, setBoxSize] = useState(() =>
    fitInBox(photo.width, photo.height, pageWidth, pageHeight),
  );
  const dispW = useSharedValue(boxSize.width);
  const dispH = useSharedValue(boxSize.height);

  // Never write a shared value during render (react-compiler would cache it).
  useEffect(() => {
    dispW.value = boxSize.width;
    dispH.value = boxSize.height;
  }, [boxSize.width, boxSize.height, dispW, dispH]);

  // Intrinsic size is optional on ViewerPhoto; recover it from decode.
  const handleLoad = useCallback(
    (event: ImageLoadEventData) => {
      if (photo.width && photo.height) return;
      const { width, height } = event.source ?? {};
      if (!width || !height) return;
      setBoxSize(fitInBox(width, height, pageWidth, pageHeight));
    },
    [photo.width, photo.height, pageWidth, pageHeight],
  );

  // Leaving a page resets its zoom, so returning to it later starts clean.
  useAnimatedReaction(
    () => {
      'worklet';
      return activeIndex.value;
    },
    (current, previous) => {
      'worklet';
      if (current === previous) return;
      if (current !== index && scale.value !== MIN_SCALE) timedReset(scale, tx, ty);
    },
    [index],
  );

  /* ----------------------------- pinch ----------------------------- *
   * Transform model: a point p in image-local coords (origin = image
   * centre) lands on screen at  c + t + s·p  (c = container centre).
   * To keep the focal point pinned while scaling s → s':
   *     p0 = (f_start − t_start) / s_start
   *     t' = f_live − (s'/s_start)·(f_start − t_start)
   * Using the LIVE focal also gives free two-finger panning.
   * ------------------------------------------------------------------ */
  const pinch = Gesture.Pinch()
    .onStart((e) => {
      'worklet';
      startScale.value = scale.value;
      startX.value = tx.value;
      startY.value = ty.value;
      focalX.value = e.focalX - pageWidth / 2;
      focalY.value = e.focalY - pageHeight / 2;
    })
    .onUpdate((e) => {
      'worklet';
      const next = clamp(
        startScale.value * e.scale,
        MIN_SCALE / PINCH_OVERSHOOT,
        MAX_SCALE * PINCH_OVERSHOOT,
      );
      const k = next / startScale.value;
      scale.value = next;
      tx.value = e.focalX - pageWidth / 2 - k * (focalX.value - startX.value);
      ty.value = e.focalY - pageHeight / 2 - k * (focalY.value - startY.value);
    })
    .onEnd(() => {
      'worklet';
      if (scale.value <= MIN_SCALE) {
        springReset(scale, tx, ty);
        return;
      }
      const s = Math.min(scale.value, MAX_SCALE);
      const mx = maxOffset(dispW.value, pageWidth, s);
      const my = maxOffset(dispH.value, pageHeight, s);
      scale.value = withSpring(s, SPRING);
      tx.value = withSpring(clamp(tx.value, -mx, mx), SPRING);
      ty.value = withSpring(clamp(ty.value, -my, my), SPRING);
    });

  /* -------------------------- double tap --------------------------- *
   * At s = 1, t = 0, zooming to k around focal f gives t' = f·(1 − k).
   * ------------------------------------------------------------------ */
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(260)
    .maxDelay(260)
    .maxDistance(32)
    .onEnd((e, success) => {
      'worklet';
      if (!success) return;
      if (scale.value > ZOOMED_EPSILON) {
        springReset(scale, tx, ty);
        return;
      }
      const target = DOUBLE_TAP_SCALE;
      const fx = e.x - pageWidth / 2;
      const fy = e.y - pageHeight / 2;
      const mx = maxOffset(dispW.value, pageWidth, target);
      const my = maxOffset(dispH.value, pageHeight, target);
      scale.value = withSpring(target, SPRING);
      tx.value = withSpring(clamp(fx * (1 - target), -mx, mx), SPRING);
      ty.value = withSpring(clamp(fy * (1 - target), -my, my), SPRING);
    });

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .maxDuration(260)
    .onEnd((_e, success) => {
      'worklet';
      if (success) runOnJS(onToggleChrome)();
    });

  /* ----------------------------- pan ------------------------------- */
  const pan = Gesture.Pan()
    .maxPointers(1) // 2-finger movement belongs to Pinch
    .onStart(() => {
      'worklet';
      intent.value = NONE;
      startX.value = tx.value;
      startY.value = ty.value;
      pagerStart.value = pagerX.value;
    })
    .onUpdate((e) => {
      'worklet';
      if (intent.value === NONE) {
        if (scale.value > ZOOMED_EPSILON) {
          intent.value = IMAGE;
        } else if (
          Math.abs(e.translationX) > DECIDE_THRESHOLD ||
          Math.abs(e.translationY) > DECIDE_THRESHOLD
        ) {
          intent.value = Math.abs(e.translationX) > Math.abs(e.translationY) ? PAGE : DISMISS;
        } else {
          return; // still ambiguous — do nothing yet
        }
      }

      if (intent.value === IMAGE) {
        const mx = maxOffset(dispW.value, pageWidth, scale.value);
        const my = maxOffset(dispH.value, pageHeight, scale.value);
        tx.value = clamp(startX.value + e.translationX, -mx, mx);
        ty.value = clamp(startY.value + e.translationY, -my, my);
      } else if (intent.value === PAGE) {
        const min = -(count - 1) * stride;
        let next = pagerStart.value + e.translationX;
        if (next > 0) next *= 0.35; // rubber band, first page
        else if (next < min) next = min + (next - min) * 0.35; // last page
        pagerX.value = next;
      } else {
        dragY.value = e.translationY;
        backdrop.value = clamp(1 - Math.abs(e.translationY) / (pageHeight * 0.55), 0.25, 1);
      }
    })
    .onEnd((e, success) => {
      'worklet';
      const mode = intent.value;
      intent.value = NONE;

      // Cancelled (a second finger arrived → Pinch took over): restore.
      if (!success) {
        if (mode === PAGE) pagerX.value = withSpring(-activeIndex.value * stride, PAGE_SPRING);
        if (mode === DISMISS) {
          dragY.value = withSpring(0, SPRING);
          backdrop.value = withTiming(1, { duration: 160 });
        }
        return;
      }

      if (mode === IMAGE) {
        const mx = maxOffset(dispW.value, pageWidth, scale.value);
        const my = maxOffset(dispH.value, pageHeight, scale.value);
        if (mx > 0) {
          tx.value = withDecay({
            velocity: e.velocityX,
            clamp: [-mx, mx],
            rubberBandEffect: true,
            deceleration: 0.99,
          });
        }
        if (my > 0) {
          ty.value = withDecay({
            velocity: e.velocityY,
            clamp: [-my, my],
            rubberBandEffect: true,
            deceleration: 0.99,
          });
        }
      } else if (mode === PAGE) {
        const current = activeIndex.value;
        let target = current;
        if (
          e.translationX <= -pageWidth * PAGE_TRIGGER_RATIO ||
          e.velocityX <= -PAGE_TRIGGER_VELOCITY
        ) {
          target = current + 1;
        } else if (
          e.translationX >= pageWidth * PAGE_TRIGGER_RATIO ||
          e.velocityX >= PAGE_TRIGGER_VELOCITY
        ) {
          target = current - 1;
        }
        target = Math.min(Math.max(target, 0), count - 1);
        pagerX.value = withSpring(-target * stride, { ...PAGE_SPRING, velocity: e.velocityX });
        if (target !== current) {
          activeIndex.value = target;
          runOnJS(onIndexChange)(target);
        }
      } else if (mode === DISMISS) {
        const shouldClose =
          Math.abs(e.translationY) > DISMISS_DISTANCE || Math.abs(e.velocityY) > DISMISS_VELOCITY;
        if (shouldClose) {
          const direction = e.translationY >= 0 ? 1 : -1;
          backdrop.value = withTiming(0, { duration: 140 });
          dragY.value = withTiming(direction * pageHeight * 0.6, { duration: 160 });
          runOnJS(onRequestClose)();
        } else {
          dragY.value = withSpring(0, SPRING);
          backdrop.value = withTiming(1, { duration: 160 });
        }
      }
    });

  /* ------------------------- composition ---------------------------- *
   * Race(  Simultaneous(pinch, pan),  Exclusive(doubleTap, singleTap)  )
   *
   * • Simultaneous(pinch, pan): pinch-while-panning is a single continuous
   *   interaction. `maxPointers(1)` keeps pan out of the way once a second
   *   finger lands, and the pinch's live focal handles two-finger dragging.
   * • Exclusive(doubleTap, singleTap): singleTap waits for doubleTap to fail,
   *   so a double tap never fires "toggle chrome" first.
   * • Race between the two groups: a tap involves no movement so pan/pinch
   *   never activate; conversely any drag immediately fails the taps.
   * ------------------------------------------------------------------ */
  const gesture = Gesture.Race(
    Gesture.Simultaneous(pinch, pan),
    Gesture.Exclusive(doubleTap, singleTap),
  );

  const imageStyle = useAnimatedStyle(() => {
    'worklet';
    // RN applies transforms left→right: p ↦ translate(scale(p)) = t + s·p,
    // which is exactly the model the gesture math assumes. Keep this order.
    return {
      transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
    };
  });

  const uri = photo.uri;
  const preview = photo.previewUri ?? null;
  const placeholder = photo.blurhash ?? (preview && preview !== uri ? { uri: preview } : undefined);

  return (
    <GestureDetector gesture={gesture}>
      <View collapsable={false} style={[styles.page, { width: pageWidth, height: pageHeight }]}>
        <Animated.View style={[{ width: boxSize.width, height: boxSize.height }, imageStyle]}>
          <Image
            source={uri ? { uri } : undefined}
            placeholder={placeholder}
            placeholderContentFit="contain"
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            transition={150}
            cachePolicy="memory-disk"
            priority="high"
            allowDownscaling={false} // critical: keeps pixels sharp at 4× zoom
            recyclingKey={photo.id}
            onLoad={handleLoad}
            accessibilityIgnoresInvertColors
          />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  page: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
