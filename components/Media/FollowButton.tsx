import { Bell, BellRing } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { useFollow } from '@/hooks/media/useFollow';
import type { MediaFollowKind } from '@/types/media/casaMedia';

interface Props {
  kind: MediaFollowKind;
  refId: string | number | null | undefined;
  /** Icon-only, for a crowded header row. */
  compact?: boolean;
}

/**
 * Follow a match or a category (§26).
 *
 * What this actually buys the user is notifications: the admin can send "only
 * to users following that match", so the label says Notify rather than Follow —
 * "following" a fixture that finishes in two hours is a confusing promise, and
 * the button is not building a feed.
 *
 * Filled state uses the gold, unfilled the neutral border, matching
 * `Team/Chip`: an active state that fills with gold is the app's loudest
 * affordance and is reserved for the primary action on a screen.
 */
export default function FollowButton({ kind, refId, compact = false }: Props) {
  const { t } = useTranslation();
  const { following, toggle, isPending, enabled } = useFollow(kind, refId);

  if (!enabled) return null;

  const Icon = following ? BellRing : Bell;
  const label = following ? t('casaMedia.following') : t('casaMedia.follow');

  return (
    <Touchable
      onPress={toggle}
      disabled={isPending}
      accessibilityRole="button"
      accessibilityState={{ selected: following, disabled: isPending }}
      accessibilityLabel={label}
      accessibilityHint={t('casaMedia.followHint')}
      hitSlop={8}
      style={({ pressed }) => ({ opacity: pressed || isPending ? 0.7 : 1 })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          height: 32,
          paddingHorizontal: compact ? 8 : 12,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: following ? Colors.darkGold : Colors.border.default,
          backgroundColor: following ? Colors.darkGold : 'transparent',
        }}
      >
        <Icon size={15} color={following ? Colors.background.deepDark : Colors.text.secondary} />
        {compact ? null : (
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: following ? Colors.background.deepDark : Colors.text.secondary,
            }}
          >
            {label}
          </Text>
        )}
      </View>
    </Touchable>
  );
}
