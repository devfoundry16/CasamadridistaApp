import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Square, SquareCheck, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Modal, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import T from '@/components/Social/T';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { socialKeys } from '@/hooks/social/keys';
import { afterSaveChange, useSavedCollections } from '@/hooks/social/useSavedCollections';
import PostService from '@/services/PostService';
import {
  COLLECTION_NAME_MAX,
  collectionErrorKey,
  collectionNameProblem,
  toggleCollection,
} from '@/utils/savedCollections.core';

interface Props {
  visible: boolean;
  postId: string;
  onClose: () => void;
  /** The post is saved now (a post in a collection is always saved). */
  onSaved?: () => void;
}

/**
 * "Save to collection": tick any of your collections for this post, or make
 * a new one, then Done. Done saves the post too; unticking every collection
 * keeps it saved, in none. Collections are private, so any post you can see
 * can go in one. Opened from a long press on the bookmark, or the share sheet.
 */
export default function CollectionPickerSheet({ visible, postId, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const collections = useSavedCollections(visible);
  const current = useQuery({
    queryKey: socialKeys.postCollections(postId),
    queryFn: () => PostService.postCollections(postId),
    enabled: visible,
    staleTime: 0,
  });

  const [ticked, setTicked] = useState<string[] | null>(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  // A fresh start each time the sheet opens, from the post's current collections.
  useEffect(() => {
    if (!visible) {
      setTicked(null);
      setNewName('');
      setCreating(false);
    } else if (ticked === null && current.data) {
      setTicked(current.data);
    }
  }, [visible, current.data, ticked]);

  const fail = (error: unknown) =>
    Alert.alert(t('common.error'), t(collectionErrorKey(error instanceof Error ? error.message : null)));

  const create = async () => {
    if (collectionNameProblem(newName) || busy) return;
    setBusy(true);
    try {
      const made = await PostService.createCollection(newName.trim());
      await queryClient.invalidateQueries({ queryKey: socialKeys.savedCollections() });
      if (made) setTicked((list) => toggleCollection(list ?? [], made.id));
      setNewName('');
      setCreating(false);
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  const done = async () => {
    if (busy || ticked === null) return;
    setBusy(true);
    try {
      const result = await PostService.setPostCollections(postId, ticked);
      queryClient.setQueryData(socialKeys.postCollections(postId), result.collection_ids ?? ticked);
      afterSaveChange(queryClient, postId, true, result.save_count);
      onSaved?.();
      onClose();
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  const loading = collections.isPending || current.isPending || ticked === null;
  const list = collections.data ?? [];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: Colors.background.deepDark, paddingBottom: insets.bottom }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
          <Touchable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('common.cancel')}>
            <X size={22} color={Colors.text.tertiary} />
          </Touchable>
          <T step="headline" weight="bold" style={{ flex: 1 }}>
            {t('social.collections.saveTo')}
          </T>
          <Touchable onPress={done} disabled={busy || loading} hitSlop={10} accessibilityRole="button">
            {busy ? (
              <ActivityIndicator color={Colors.darkGold} />
            ) : (
              <T step="body" weight="bold" color={loading ? Colors.text.muted : Colors.darkGold}>
                {t('social.collections.done')}
              </T>
            )}
          </Touchable>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.darkGold} style={{ marginTop: 24 }} />
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled">
            {list.length === 0 && !creating ? (
              <T step="footnote" color={Colors.text.tertiary} style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                {t('social.collections.empty')}
              </T>
            ) : null}
            {list.map((c) => {
              const on = (ticked ?? []).includes(c.id);
              return (
                <Touchable
                  key={c.id}
                  onPress={() => setTicked((cur) => toggleCollection(cur ?? [], c.id))}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={c.name}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingHorizontal: 16,
                    minHeight: 52,
                    backgroundColor: pressed ? Colors.background.card : 'transparent',
                  })}
                >
                  {on ? <SquareCheck size={22} color={Colors.darkGold} /> : <Square size={22} color={Colors.text.tertiary} />}
                  <T step="body" style={{ flex: 1 }} numberOfLines={1}>
                    {c.name}
                  </T>
                  <T step="footnote" color={Colors.text.tertiary} ltr>
                    {String(c.post_count)}
                  </T>
                </Touchable>
              );
            })}

            {creating ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10 }}>
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder={t('social.collections.namePlaceholder')}
                  placeholderTextColor={Colors.text.muted}
                  maxLength={COLLECTION_NAME_MAX}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={create}
                  accessibilityLabel={t('social.collections.namePlaceholder')}
                  style={{
                    flex: 1,
                    color: Colors.text.primary,
                    fontSize: 15,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: Colors.background.card,
                  }}
                />
                <Touchable onPress={create} disabled={!!collectionNameProblem(newName) || busy} accessibilityRole="button">
                  <T step="body" weight="bold" color={collectionNameProblem(newName) ? Colors.text.muted : Colors.darkGold}>
                    {t('social.collections.create')}
                  </T>
                </Touchable>
              </View>
            ) : (
              <Touchable
                onPress={() => setCreating(true)}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 16,
                  minHeight: 52,
                  backgroundColor: pressed ? Colors.background.card : 'transparent',
                })}
              >
                <Plus size={22} color={Colors.darkGold} />
                <T step="body" color={Colors.darkGold}>
                  {t('social.collections.newTitle')}
                </T>
              </Touchable>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
