import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { ArrowUp, ImagePlus, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, I18nManager, ScrollView, TextInput, View } from 'react-native';

import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { typeStyle } from '@/constants/type';
import { useFont } from '@/contexts/FontContext';
import type { PhotoInput } from '@/hooks/social/useThread';
import T from './T';

const MAX_PHOTOS = 4;
const BODY_MAX = 2000;

interface Props {
  onSend: (input: { body?: string; photos?: PhotoInput[] }) => void;
  onTyping: () => void;
  /** Static bottom padding from `useKeyboardOffsets` — never toggled on keyboard show. */
  bottomInset: number;
  /** When set, the composer is replaced by this explanation. */
  disabledReason?: string | null;
}

/**
 * The thread composer. A near-copy of `Community/Comments/CommentInput` in
 * structure, so the keyboard maths in `hooks/useKeyboardOffsets.ts` holds, with
 * a photo tray and a gold send button carrying a dark glyph.
 */
export default function Composer({ onSend, onTyping, bottomInset, disabledReason }: Props) {
  const { t } = useTranslation();
  const { isArabic } = useFont();
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<PhotoInput[]>([]);

  if (disabledReason) {
    return (
      <View style={{ borderTopWidth: 1, borderColor: Colors.border.default, backgroundColor: Colors.background.dark, paddingBottom: bottomInset }}>
        <T step="footnote" color={Colors.text.tertiary} align="center" style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
          {disabledReason}
        </T>
      </View>
    );
  }

  const pick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('account.permissionDenied'), t('account.grantAccess'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 1,
    });
    if (result.canceled) return;
    setPhotos((current) =>
      [...current, ...result.assets.map((a) => ({ uri: a.uri, width: a.width || null, height: a.height || null }))].slice(0, MAX_PHOTOS),
    );
  };

  const canSend = text.trim().length > 0 || photos.length > 0;
  const send = () => {
    if (!canSend) return;
    onSend({ body: text, photos });
    setText('');
    setPhotos([]);
  };

  return (
    <View style={{ borderTopWidth: 1, borderColor: Colors.border.default, backgroundColor: Colors.background.dark, paddingBottom: bottomInset }}>
      {photos.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 10, gap: 8 }}>
          {photos.map((p, i) => (
            <View key={`${p.uri}-${i}`}>
              <Image source={{ uri: p.uri }} style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: Colors.background.card }} contentFit="cover" />
              <Touchable
                onPress={() => setPhotos((current) => current.filter((_, j) => j !== i))}
                accessibilityRole="button"
                accessibilityLabel={t('social.composer.removePhoto')}
                hitSlop={8}
                style={{ position: 'absolute', top: -6, end: -6, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background.light }}
              >
                <X size={12} color={Colors.text.primary} />
              </Touchable>
            </View>
          ))}
        </ScrollView>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8, paddingVertical: 8 }}>
        <Touchable
          onPress={pick}
          disabled={photos.length >= MAX_PHOTOS}
          accessibilityRole="button"
          accessibilityLabel={t('social.composer.addPhoto')}
          hitSlop={6}
          style={({ pressed }) => ({ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', opacity: photos.length >= MAX_PHOTOS ? 0.4 : pressed ? 0.6 : 1 })}
        >
          <ImagePlus size={22} color={Colors.darkGold} />
        </Touchable>

        <TextInput
          value={text}
          onChangeText={(value) => {
            setText(value);
            if (value.length) onTyping();
          }}
          placeholder={t('social.composer.placeholder')}
          placeholderTextColor={Colors.text.muted}
          multiline
          maxLength={BODY_MAX}
          accessibilityLabel={t('social.composer.placeholder')}
          style={{
            flex: 1,
            ...typeStyle('body', isArabic),
            color: Colors.text.primary,
            backgroundColor: Colors.background.medium,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: Colors.border.default,
            paddingHorizontal: 14,
            paddingTop: 9,
            paddingBottom: 9,
            maxHeight: 120,
            marginHorizontal: 4,
            textAlign: I18nManager.isRTL ? 'right' : 'left',
          }}
        />

        <Touchable
          onPress={send}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel={t('social.composer.send')}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: canSend ? Colors.darkGold : Colors.background.medium,
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <ArrowUp size={20} color={canSend ? Colors.text.dark : Colors.text.muted} strokeWidth={2.6} />
        </Touchable>
      </View>
    </View>
  );
}
