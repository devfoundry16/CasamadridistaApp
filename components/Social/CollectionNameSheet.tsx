import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, TextInput, View } from 'react-native';

import T from '@/components/Social/T';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { COLLECTION_NAME_MAX, collectionNameProblem } from '@/utils/savedCollections.core';

interface Props {
  visible: boolean;
  title: string;
  submitLabel: string;
  initialName?: string;
  onSubmit: (name: string) => Promise<void>;
  onClose: () => void;
}

/**
 * A collection's name, for a new one or a rename: one field, 1–40
 * characters. Works the same on iOS and Android (Alert.prompt is iOS only).
 */
export default function CollectionNameSheet({ visible, title, submitLabel, initialName = '', onSubmit, onClose }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) setName(initialName);
  }, [visible, initialName]);

  const ok = !collectionNameProblem(name);
  const submit = async () => {
    if (!ok || busy) return;
    setBusy(true);
    try {
      await onSubmit(name.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
          style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          <Pressable onPress={() => {}} style={{ borderRadius: 14, padding: 16, gap: 14, backgroundColor: Colors.background.deepDark, borderWidth: 1, borderColor: Colors.border.default }}>
            <T step="headline" weight="bold">
              {title}
            </T>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('social.collections.namePlaceholder')}
              placeholderTextColor={Colors.text.muted}
              maxLength={COLLECTION_NAME_MAX}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={submit}
              accessibilityLabel={t('social.collections.namePlaceholder')}
              style={{ color: Colors.text.primary, fontSize: 15, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.background.card }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 20 }}>
              <Touchable onPress={onClose} accessibilityRole="button">
                <T step="body" color={Colors.text.tertiary}>
                  {t('common.cancel')}
                </T>
              </Touchable>
              <Touchable onPress={submit} disabled={!ok || busy} accessibilityRole="button">
                {busy ? (
                  <ActivityIndicator color={Colors.darkGold} />
                ) : (
                  <T step="body" weight="bold" color={ok ? Colors.darkGold : Colors.text.muted}>
                    {submitLabel}
                  </T>
                )}
              </Touchable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
