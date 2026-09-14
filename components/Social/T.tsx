import React from 'react';
import type { TextProps, TextStyle } from 'react-native';

import { Text } from '@/components/Text';
import Colors from '@/constants/colors';
import { typeStyle, type TypeStep } from '@/constants/type';
import { useFont } from '@/contexts/FontContext';

interface Props extends TextProps {
  step?: TypeStep;
  weight?: 'regular' | 'semibold' | 'bold';
  color?: string;
  /** Pin LTR for numbers, handles and timestamps inside Arabic text. */
  ltr?: boolean;
  align?: TextStyle['textAlign'];
}

/**
 * Text on the Casa Social type scale (`constants/type.ts`).
 *
 * Weight goes through `fontWeight` so `components/Text` can swap Cairo's bold
 * file in under Arabic rather than letting Android synthesise a fake bold.
 */
export default function T({ step = 'body', weight = 'regular', color = Colors.text.primary, ltr, align, style, ...rest }: Props) {
  const { isArabic } = useFont();
  return (
    <Text
      {...rest}
      style={[
        typeStyle(step, isArabic),
        {
          color,
          fontWeight: weight === 'bold' ? '700' : weight === 'semibold' ? '600' : '400',
          ...(ltr ? { writingDirection: 'ltr' as const } : {}),
          ...(align ? { textAlign: align } : {}),
        },
        style,
      ]}
    />
  );
}
