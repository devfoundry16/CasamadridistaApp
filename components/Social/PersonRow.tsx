import { useRouter } from 'expo-router';
import { BadgeCheck } from 'lucide-react-native';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import type { PersonCard } from '@/types/social';
import Avatar from './Avatar';
import T from './T';

interface Props {
  person: PersonCard;
  /** A second line under the name: "@handle · 3 mutual friends". */
  detail?: string | null;
  trailing?: React.ReactNode;
  onPress?: () => void;
  online?: boolean;
}

/** One person in a list. Tapping opens their profile unless told otherwise. */
function PersonRow({ person, detail, trailing, onPress, online }: Props) {
  const router = useRouter();
  const open = onPress ?? (() => router.push(`/user/${person.id}`));
  const subtitle = detail ?? (person.username ? `@${person.username}` : null);

  return (
    <Touchable
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={[person.name, subtitle].filter(Boolean).join(', ')}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.background.card }]}
    >
      <Avatar uri={person.avatar_url} name={person.name} size={44} online={online} />
      <View style={{ flex: 1, marginStart: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <T step="body" weight="semibold" numberOfLines={1} style={{ flexShrink: 1 }}>
            {person.name}
          </T>
          {person.is_verified ? <BadgeCheck size={14} color={Colors.darkGold} style={{ marginStart: 4 }} /> : null}
        </View>
        {subtitle ? (
          <T step="footnote" color={Colors.text.tertiary} numberOfLines={1} style={{ marginTop: 1 }}>
            {subtitle}
          </T>
        ) : null}
      </View>
      {trailing ? <View style={{ marginStart: 12 }}>{trailing}</View> : null}
    </Touchable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 64,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.default,
  },
});

export default memo(PersonRow);
