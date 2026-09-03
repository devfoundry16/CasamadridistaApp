import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import CasaMediaService from '@/services/CasaMediaService';

interface Props {
  itemId: string;
  onInteract?: () => void;
}

/** Fixed set — the server stores the emoji verbatim, so this list is the schema. */
const REACTIONS = ['👏', '🔥', '💜', '😍', '😮', '⚽'] as const;

/**
 * Quick emoji reactions on a story. Optimistic and one-at-a-time: tapping the
 * selected reaction again removes it (`DELETE /items/:id/reaction`).
 */
export default function StoryReactions({ itemId, onInteract }: Props) {
  const { t } = useTranslation();
  const requireAuth = useRequireAuth();
  const [selected, setSelected] = useState<string | null>(null);

  const handlePress = (emoji: string) => {
    onInteract?.();
    if (!requireAuth({ href: `/media/item/${itemId}`, mediaId: itemId })) return;

    const next = selected === emoji ? null : emoji;
    setSelected(next);
    const request = next
      ? CasaMediaService.react(itemId, next)
      : CasaMediaService.unreact(itemId);
    request.catch(() => setSelected(selected));
  };

  return (
    <View
      style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}
      accessibilityRole="radiogroup"
      accessibilityLabel={t('casaMedia.reactions')}
    >
      {REACTIONS.map((emoji) => {
        const active = selected === emoji;
        return (
          <Touchable
            key={emoji}
            onPress={() => handlePress(emoji)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            accessibilityLabel={emoji}
            hitSlop={6}
            style={({ pressed }) => ({
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? 'rgba(188,144,69,0.35)' : 'rgba(0,0,0,0.35)',
              borderWidth: 1,
              borderColor: active ? Colors.darkGold : 'transparent',
              transform: [{ scale: pressed ? 0.92 : 1 }],
            })}
          >
            <Text style={{ fontSize: 20 }}>{emoji}</Text>
          </Touchable>
        );
      })}
    </View>
  );
}
