import { Send } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, TextInput, View } from 'react-native';

import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import CasaMediaService from '@/services/CasaMediaService';

interface Props {
  itemId: string;
  /** Pause the story while the keyboard is up, resume when it goes away. */
  onFocus?: () => void;
  onBlur?: () => void;
}

/** Reply to a story. A reply is a comment on the story item. */
export default function StoryReplyBar({ itemId, onFocus, onBlur }: Props) {
  const { t } = useTranslation();
  const requireAuth = useRequireAuth();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    if (!requireAuth({ href: `/media/item/${itemId}`, mediaId: itemId })) return;

    setSending(true);
    try {
      await CasaMediaService.reply(itemId, body);
      setText('');
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message ?? t('casaMedia.replyFailed'));
    } finally {
      setSending(false);
    }
  };

  const hasText = text.trim().length > 0;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <TextInput
        value={text}
        onChangeText={setText}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={t('casaMedia.replyPlaceholder')}
        placeholderTextColor="rgba(255,255,255,0.6)"
        maxLength={500}
        style={{
          flex: 1,
          height: 42,
          borderRadius: 21,
          paddingHorizontal: 16,
          color: Colors.textWhite,
          backgroundColor: 'rgba(0,0,0,0.45)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.35)',
        }}
      />
      <Touchable
        onPress={send}
        disabled={!hasText || sending}
        accessibilityRole="button"
        accessibilityLabel={t('casaMedia.send')}
        style={({ pressed }) => ({
          marginStart: 8,
          width: 42,
          height: 42,
          borderRadius: 21,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: hasText ? Colors.darkGold : 'rgba(0,0,0,0.45)',
          opacity: pressed ? 0.75 : 1,
        })}
      >
        {sending ? (
          <ActivityIndicator size="small" color={Colors.textWhite} />
        ) : (
          <Send size={18} color={hasText ? Colors.text.dark : Colors.textWhite} />
        )}
      </Touchable>
    </View>
  );
}
