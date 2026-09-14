import { AlertCircle, Check, CheckCheck, Clock3 } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import Colors from '@/constants/colors';
import type { ReceiptState } from '@/types/social';

interface Props {
  state: ReceiptState;
  /** Glyph colour on my gold bubble is dark; on a neutral ground it is muted. */
  onGold?: boolean;
}

/**
 * The receipt — the one orchestrated motion in Casa Social (design plan).
 *
 * The bubble appears at rest; only this glyph moves, and only when the state
 * advances: pending → sent ✓ → delivered ✓✓ → seen ✓✓ in gold. A brief scale
 * settle answers the action. Nothing else in the feature animates on entry.
 */
export default function ReceiptGlyph({ state, onGold = false }: Props) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (state === 'pending') return;
    opacity.value = withSequence(withTiming(0.35, { duration: 0 }), withTiming(1, { duration: 180 }));
    scale.value = withSequence(withTiming(0.7, { duration: 0 }), withTiming(1, { duration: 220 }));
  }, [state, opacity, scale]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));

  const muted = onGold ? 'rgba(26,26,26,0.6)' : Colors.text.tertiary;
  // Seen is gold on a neutral ground; on a gold bubble gold would vanish, so it
  // is the full-strength dark instead.
  const seen = onGold ? Colors.text.dark : Colors.darkGold;

  const size = 14;
  const icon =
    state === 'pending' ? (
      <Clock3 size={size - 2} color={muted} />
    ) : state === 'failed' ? (
      <AlertCircle size={size} color={Colors.status.error} />
    ) : state === 'sent' ? (
      <Check size={size} color={muted} />
    ) : (
      <CheckCheck size={size} color={state === 'seen' ? seen : muted} strokeWidth={state === 'seen' ? 2.6 : 2} />
    );

  return (
    <Animated.View style={style} accessible accessibilityLabel={t(`social.receipt.${state}`)}>
      {icon}
    </Animated.View>
  );
}
