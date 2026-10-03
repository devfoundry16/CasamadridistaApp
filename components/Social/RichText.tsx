import { useRouter, type Href } from 'expo-router';
import React, { useMemo } from 'react';
import { Linking, Text, type TextProps } from 'react-native';

import { Text as AppText } from '@/components/Text';
import type { TypeStep } from '@/constants/type';
import { hrefForToken, isSafeUrl, tokenize } from '@/utils/richText.core';
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
 *   - a URL opens in the browser (http and https only);
 *   - `@handle` opens that person's profile (`/user/@handle`);
 *   - `#tag` opens the tag's Community feed (`/community/hashtag/[tag]`).
 *
 * Mentions and hashtags are set in semibold rather than underlined, the way
 * people expect to see them. Each link is a nested `Text` with its own
 * `onPress`: the touch lands on the innermost text, which takes it, so tapping
 * a link inside a pressable card opens the link and not the card.
 *
 * `onLongPress` goes to the links only — they take the touch from whatever
 * the text sits in, so a long press on one would otherwise do nothing.
 *
 * Everything else is passed to the outer `T`, so `selectable`, `numberOfLines`
 * and `style` behave as they would on plain text. Links are nested `Text`, so
 * they inherit the font, size and direction.
 */
export default function RichText({ text, linkColor, color, onLongPress, ...rest }: Props) {
  const router = useRouter();
  const tokens = useMemo(() => tokenize(text), [text]);
  const tint = linkColor ?? color;

  return (
    <T color={color} {...rest}>
      {tokens.map((token, i) => {
        if (token.type === 'url') {
          return (
            <Text
              key={i}
              onPress={() => openLink(token.value)}
              onLongPress={onLongPress}
              accessibilityRole="link"
              style={{ color: tint, textDecorationLine: 'underline' }}
            >
              {token.value}
            </Text>
          );
        }
        const href = hrefForToken(token);
        if (!href) return token.value;
        // AppText, so Arabic gets Cairo's bold file rather than a synthesised bold.
        return (
          <AppText key={i} onPress={() => router.push(href as Href)} onLongPress={onLongPress} accessibilityRole="link" style={{ color: tint, fontWeight: '600' }}>
            {token.value}
          </AppText>
        );
      })}
    </T>
  );
}
