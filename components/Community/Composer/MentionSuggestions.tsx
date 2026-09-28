import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import Avatar from '@/components/Social/Avatar';
import T from '@/components/Social/T';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { useFriends, useUserSearch } from '@/hooks/social/useFriends';
import type { PersonCard } from '@/types/social';
import { peopleMatching } from '@/utils/mentions.core';

const LIMIT = 5;

interface Props {
  /** What has been typed after the `@`. */
  query: string;
  onPick: (person: PersonCard & { username: string }) => void;
}

/**
 * The people offered while an `@word` is being typed in the composer.
 *
 * Friends match from the first letter, locally; `/users/search` joins in from
 * two letters, debounced by `useUserSearch`. Only people with a username can be
 * mentioned, because the mention is the handle. Renders nothing when there is
 * no one to offer, so it never leaves an empty box under the input.
 *
 * Plain rows rather than a FlatList: at most five, inside the composer's
 * ScrollView, whose `keyboardShouldPersistTaps="handled"` lets a tap pick a
 * person without closing the keyboard first.
 */
export default function MentionSuggestions({ query, onPick }: Props) {
  const { t } = useTranslation();
  const { data: friends = [] } = useFriends();
  const search = useUserSearch(query, null, null);

  const people = useMemo(
    () => peopleMatching(query, friends, search.data ?? [], { requireUsername: true, limit: LIMIT }),
    [query, friends, search.data],
  );

  if (!people.length) return null;

  return (
    <View style={styles.list} accessibilityLabel={t('community.mentionSuggestions')}>
      {people.map((person) => (
        <Touchable
          key={person.id}
          onPress={() => onPick(person as PersonCard & { username: string })}
          accessibilityRole="button"
          accessibilityLabel={t('community.mentionPick', { name: person.name, handle: person.username })}
          style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.background.light }]}
        >
          <Avatar uri={person.avatar_url} name={person.name} size={28} />
          <View style={{ flex: 1, marginStart: 10 }}>
            <T step="footnote" weight="semibold" numberOfLines={1}>
              {person.name}
            </T>
            <T step="caption" color={Colors.text.tertiary} numberOfLines={1}>
              @{person.username}
            </T>
          </View>
        </Touchable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.medium,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
