import React, { useMemo } from 'react';
import { Linking, Text, type TextProps } from 'react-native';

import type { TypeStep } from '@/constants/type';
import { isSafeUrl, tokenize } from '@/utils/richText.core';
import T from './T';

interface Props extends Omit<TextProps, 'children'> {
  text: string;
  step?: TypeStep;
  weight?: 'regular' | 'semibold' | 'bold';
  color?: string;
  /** Defaults to `color`: links are told apart by the underline, so they keep contrast on any ground. */
  linkColor?: string;
}

function openLink(url: string) {
  // The tokenizer only emits http(s), but this is the last gate before the OS
  // is handed a URL, so check again.
  if (!isSafeUrl(url)) return;
  Linking.openURL(url).catch(() => {});
}

/**
 * User-written text with its links made tappable, on the Casa Social type
 * scale (`T`).
 *
 * Mentions and hashtags are recognised by `utils/richText.core.ts` but render
 * as plain text for now; Phase 2 links them to profiles and hashtag pages.
 *
 * Everything else is passed to the outer `T`, so `selectable`, `numberOfLines`
 * and `style` behave as they would on plain text. Links are nested `Text`, so
 * they inherit the font, size and direction.
 */
export default function RichText({ text, linkColor, color, ...rest }: Props) {
  const tokens = useMemo(() => tokenize(text), [text]);

  return (
    <T color={color} {...rest}>
      {tokens.map((token, i) =>
        token.type === 'url' ? (
          <Text
            key={i}
            onPress={() => openLink(token.value)}
            accessibilityRole="link"
            style={{ color: linkColor ?? color, textDecorationLine: 'underline' }}
          >
            {token.value}
          </Text>
        ) : (
          token.value
        ),
      )}
    </T>
  );
}
