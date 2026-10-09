import { Check, X } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, Text, View } from 'react-native';

import T from '@/components/Social/T';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { FEELINGS, type Feeling } from '@/utils/postCompose.core';

interface Props {
  visible: boolean;
  value: string | null;
  onChange: (key: string | null) => void;
  onClose: () => void;
}

/**
 * Feeling / activity for a post: one from a fixed list (never free text, so it
 * needs no moderation and reads in both languages), or none. Picking closes
 * the sheet.
 */
export default function FeelingSheet({ visible, value, onChange, onClose }: Props) {
  const { t } = useTranslation();
  const pick = (key: string | null) => {
    onChange(key);
    onClose();
  };

  const row = (f: Feeling | null) => {
    const key = f?.key ?? null;
    const on = value === key;
    const label = f ? t(`community.compose.feeling.${f.key}`) : t('community.compose.feelingNone');
    return (
      <Touchable
        key={key ?? 'none'}
        onPress={() => pick(key)}
        accessibilityRole="radio"
        accessibilityState={{ checked: on }}
        accessibilityLabel={label}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          minHeight: 48,
          backgroundColor: pressed ? Colors.background.card : 'transparent',
        })}
      >
        <Text style={{ fontSize: 22, width: 36 }}>{f?.emoji ?? ''}</Text>
        <T step="body" weight={on ? 'semibold' : 'regular'} style={{ flex: 1 }}>
          {label}
        </T>
        {on ? <Check size={18} color={Colors.darkGold} /> : null}
      </Touchable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <T step="headline" weight="bold" style={{ flex: 1 }}>
            {t('community.compose.feelingTitle')}
          </T>
          <Touchable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('common.cancel')}>
            <X size={22} color={Colors.text.tertiary} />
          </Touchable>
        </View>
        <ScrollView accessibilityRole="radiogroup">
          {row(null)}
          {FEELINGS.map(row)}
        </ScrollView>
      </View>
    </Modal>
  );
}
