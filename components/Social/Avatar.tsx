import { Image } from 'expo-image';
import React, { memo, useState } from 'react';
import { View } from 'react-native';

import Colors from '@/constants/colors';
import T from './T';

interface Props {
  uri: string | null | undefined;
  name: string | null | undefined;
  size?: number;
  /** Draw the green presence dot on the trailing bottom corner. */
  online?: boolean;
}

/**
 * The app's first Avatar component.
 *
 * Until now every avatar was an inline `expo-image` with a generic PNG
 * placeholder, which made every person without a photo look identical — a real
 * problem in a friend list or an inbox. This falls back to initials instead, on
 * the card ground with the load-bearing 1px border.
 */
function Avatar({ uri, name, size = 44, online = false }: Props) {
  const [failed, setFailed] = useState(false);
  const initials = initialsOf(name);
  const dot = Math.max(10, Math.round(size * 0.26));

  return (
    <View style={{ width: size, height: size }}>
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: Colors.background.card }}
          contentFit="cover"
          transition={150}
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: Colors.background.card,
            borderWidth: 1,
            borderColor: Colors.border.default,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <T step={size >= 56 ? 'title' : size >= 40 ? 'body' : 'caption'} weight="semibold" color={Colors.darkGold}>
            {initials}
          </T>
        </View>
      )}
      {online ? (
        <View
          style={{
            position: 'absolute',
            // `end`, not `right`: the dot sits on the trailing corner in both directions.
            end: 0,
            bottom: 0,
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            backgroundColor: Colors.status.success,
            borderWidth: 2,
            borderColor: Colors.background.medium,
          }}
        />
      ) : null}
    </View>
  );
}

/** Up to two initials. Works for Arabic names too — the first letter of each word. */
export function initialsOf(name: string | null | undefined): string {
  const words = String(name ?? '')
    .replace(/^@/, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return '·';
  const first = Array.from(words[0])[0] ?? '';
  const second = words.length > 1 ? Array.from(words[words.length - 1])[0] ?? '' : '';
  return (first + second).toUpperCase();
}

export default memo(Avatar);
