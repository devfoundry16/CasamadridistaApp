import { Check, Search, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Modal, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { typeStyle } from '@/constants/type';
import { useFont } from '@/contexts/FontContext';
import { useFriends } from '@/hooks/social/useFriends';
import { useShareToFriends } from '@/hooks/social/useShareToFriends';
import type { EmbedKind, PersonCard } from '@/types/social';
import Avatar from './Avatar';
import T from './T';

const MAX_RECIPIENTS = 20;

interface Props {
  visible: boolean;
  onClose: () => void;
  /** What is being shared. */
  kind: EmbedKind;
  id: string;
  /** Shown at the top so the sender knows what they are sending. */
  subject?: string | null;
}

/**
 * "Send to a friend" — search and pick SEVERAL friends (§16), add an optional
 * note, send once. The server delivers one message into each 1:1 conversation
 * and reports per recipient, so a partial failure names who did not receive it.
 */
export default function FriendPicker({ visible, onClose, kind, id, subject }: Props) {
  const { t } = useTranslation();
  const { isArabic } = useFont();
  const insets = useSafeAreaInsets();
  const { data: friends = [], isLoading } = useFriends();
  const share = useShareToFriends();
  const [query, setQuery] = useState('');
  const [note, setNote] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^@/, '');
    if (!q) return friends;
    return friends.filter((f) => f.name.toLowerCase().includes(q) || (f.username ?? '').includes(q));
  }, [friends, query]);

  const close = () => {
    setQuery('');
    setNote('');
    setSelected([]);
    onClose();
  };

  const toggle = (person: PersonCard) =>
    setSelected((current) =>
      current.includes(person.id)
        ? current.filter((x) => x !== person.id)
        : current.length >= MAX_RECIPIENTS
          ? current
          : [...current, person.id],
    );

  const send = () => {
    share.mutate(
      { recipientIds: selected, kind, id, note },
      {
        onSuccess: (results) => {
          const failed = results.filter((r) => !r.ok);
          if (!failed.length) {
            Alert.alert(t('social.share.sentTitle'), t('social.share.sentBody', { count: results.length }));
            close();
            return;
          }
          const names = failed.map((r) => friends.find((f) => f.id === r.user_id)?.name).filter(Boolean).join(', ');
          Alert.alert(t('social.share.partialTitle'), t('social.share.partialBody', { names }));
          setSelected(failed.map((r) => r.user_id));
        },
        onError: () => Alert.alert(t('common.error'), t('social.errors.generic')),
      },
    );
  };

  const inputStyle = {
    ...typeStyle('body', isArabic),
    color: Colors.text.primary,
    flex: 1,
    paddingVertical: 8,
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <T step="headline" weight="bold">
              {t('social.share.title')}
            </T>
            {subject ? (
              <T step="footnote" color={Colors.text.tertiary} numberOfLines={1}>
                {subject}
              </T>
            ) : null}
          </View>
          <Touchable onPress={close} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('common.cancel')}>
            <X size={22} color={Colors.text.tertiary} />
          </Touchable>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border.default, backgroundColor: Colors.background.medium }}>
          <Search size={16} color={Colors.text.muted} />
          <TextInput value={query} onChangeText={setQuery} placeholder={t('social.share.searchFriends')} placeholderTextColor={Colors.text.muted} style={{ ...inputStyle, marginStart: 8 }} autoCorrect={false} accessibilityLabel={t('social.share.searchFriends')} />
        </View>

        {isLoading ? (
          <ActivityIndicator color={Colors.darkGold} style={{ marginTop: 32 }} />
        ) : (
          <FlatList
            data={shown}
            keyExtractor={(p) => p.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const on = selected.includes(item.id);
              return (
                <Touchable
                  onPress={() => toggle(item)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={item.name}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: pressed ? Colors.background.card : 'transparent' })}
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
              <T step="footnote" color={Colors.text.tertiary} align="center" style={{ padding: 32 }}>
                {friends.length ? t('social.share.noMatches') : t('social.share.noFriends')}
              </T>
            }
          />
        )}

        <View style={{ borderTopWidth: 1, borderColor: Colors.border.default, padding: 12, paddingBottom: insets.bottom + 12, gap: 10 }}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t('social.share.notePlaceholder')}
            placeholderTextColor={Colors.text.muted}
            maxLength={500}
            accessibilityLabel={t('social.share.notePlaceholder')}
            style={{ ...inputStyle, flex: 0, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border.default, backgroundColor: Colors.background.medium }}
          />
          <Touchable
            onPress={send}
            disabled={!selected.length || share.isPending}
            accessibilityRole="button"
            accessibilityLabel={t('social.share.send', { count: selected.length })}
            style={({ pressed }) => ({ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: selected.length ? Colors.darkGold : Colors.background.medium, opacity: pressed ? 0.8 : 1 })}
          >
            {share.isPending ? (
              <ActivityIndicator color={Colors.text.dark} />
            ) : (
              <T step="body" weight="bold" color={selected.length ? Colors.text.dark : Colors.text.muted}>
                {selected.length ? t('social.share.send', { count: selected.length }) : t('social.share.pick')}
              </T>
            )}
          </Touchable>
        </View>
      </View>
    </Modal>
  );
}
