import { Check, Search, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Modal, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Avatar from '@/components/Social/Avatar';
import T from '@/components/Social/T';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { typeStyle } from '@/constants/type';
import { useFont } from '@/contexts/FontContext';
import { useFriends, useUserSearch } from '@/hooks/social/useFriends';
import type { PersonCard } from '@/types/social';
import { peopleMatching, TAG_MAX, toggleTagged } from '@/utils/mentions.core';

interface Props {
  visible: boolean;
  selected: PersonCard[];
  onChange: (people: PersonCard[]) => void;
  onClose: () => void;
}

/**
 * "Tag people" for a Community post: friends first, then anyone found by name
 * or @username (`/users/search`, debounced), up to 20.
 *
 * The same sheet as `FriendPicker`, but it only picks: the composer owns the
 * list and sends it as `tagged_user_ids` with the post. The server drops
 * anyone it will not let you tag (blocked either way, restricted accounts).
 */
export default function TagPeopleSheet({ visible, selected, onChange, onClose }: Props) {
  const { t } = useTranslation();
  const { isArabic } = useFont();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const { data: friends = [], isLoading } = useFriends();
  const search = useUserSearch(query, null, null);

  const shown = useMemo(() => peopleMatching(query, friends, search.data ?? []), [query, friends, search.data]);
  const selectedIds = useMemo(() => new Set(selected.map((p) => p.id)), [selected]);
  const full = selected.length >= TAG_MAX;

  const close = () => {
    setQuery('');
    onClose();
  };

  const inputStyle = {
    ...typeStyle('body', isArabic),
    color: Colors.text.primary,
    flex: 1,
    paddingVertical: 8,
    marginStart: 8,
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <T step="headline" weight="bold">
              {t('community.tagPeopleTitle')}
            </T>
            <T step="footnote" color={full ? Colors.darkGold : Colors.text.tertiary}>
              {full ? t('community.tagPeopleLimit', { max: TAG_MAX }) : t('community.tagPeopleCount', { count: selected.length, max: TAG_MAX })}
            </T>
          </View>
          <Touchable onPress={close} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('community.tagPeopleDone')}>
            <X size={22} color={Colors.text.tertiary} />
          </Touchable>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border.default, backgroundColor: Colors.background.medium }}>
          <Search size={16} color={Colors.text.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('community.tagPeopleSearch')}
            placeholderTextColor={Colors.text.muted}
            style={inputStyle}
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel={t('community.tagPeopleSearch')}
          />
          {search.isFetching ? <ActivityIndicator size="small" color={Colors.darkGold} /> : null}
        </View>

        {isLoading ? (
          <ActivityIndicator color={Colors.darkGold} style={{ marginTop: 32 }} />
        ) : (
          <FlatList
            data={shown}
            keyExtractor={(p) => p.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const on = selectedIds.has(item.id);
              const disabled = !on && full;
              return (
                <Touchable
                  onPress={() => onChange(toggleTagged(selected, item))}
                  disabled={disabled}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on, disabled }}
                  accessibilityLabel={item.username ? `${item.name}, @${item.username}` : item.name}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    opacity: disabled ? 0.5 : 1,
                    backgroundColor: pressed ? Colors.background.card : 'transparent',
                  })}
                >
                  <Avatar uri={item.avatar_url} name={item.name} size={40} />
                  <View style={{ flex: 1, marginStart: 12 }}>
                    <T step="body" weight="semibold" numberOfLines={1}>
                      {item.name}
                    </T>
                    {item.username ? (
                      <T step="caption" color={Colors.text.tertiary}>
                        @{item.username}
                      </T>
                    ) : null}
                  </View>
                  <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: on ? 0 : 1.5, borderColor: Colors.border.light, backgroundColor: on ? Colors.darkGold : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {on ? <Check size={15} color={Colors.text.dark} strokeWidth={3} /> : null}
                  </View>
                </Touchable>
              );
            }}
            ListEmptyComponent={
              search.isFetching ? null : (
                <T step="footnote" color={Colors.text.tertiary} align="center" style={{ padding: 32 }}>
                  {query.trim() ? t('community.tagPeopleNoMatches') : t('community.tagPeopleEmpty')}
                </T>
              )
            }
          />
        )}

        <View style={{ borderTopWidth: 1, borderColor: Colors.border.default, padding: 12, paddingBottom: insets.bottom + 12 }}>
          <Touchable
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel={t('community.tagPeopleDone')}
            style={({ pressed }) => ({ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.darkGold, opacity: pressed ? 0.8 : 1 })}
          >
            <T step="body" weight="bold" color={Colors.text.dark}>
              {t('community.tagPeopleDone')}
            </T>
          </Touchable>
        </View>
      </View>
    </Modal>
  );
}
