import React, { useImperativeHandle, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Send, X } from 'lucide-react-native';
import Colors from '@/constants/colors';

export interface CommentInputHandle {
  /** Focus the text field — used when the user taps "Reply" on a comment. */
  focus: () => void;
  /** Discard any draft text. */
  clear: () => void;
}

interface Props {
  postId: string;
  /** id of the comment being replied to, or null/undefined for a top-level comment */
  replyTo?: string | null;
  /** display name shown in the "Replying to …" banner */
  replyToName?: string | null;
  onSubmit: (body: string) => Promise<void>;
  onCancelReply?: () => void;
  /**
   * Bottom safe-area inset (iOS home indicator / Android gesture bar).
   * Supplied by the host screen from `useKeyboardOffsets()` so it can never
   * drift out of sync with the KeyboardAvoidingView's keyboardVerticalOffset.
   */
  bottomInset?: number;
  placeholder?: string;
  /** React 19: `ref` is an ordinary prop; forwardRef is not needed. */
  ref?: React.Ref<CommentInputHandle>;
}

export default function CommentInput({
  replyTo,
  replyToName,
  onSubmit,
  onCancelReply,
  bottomInset = 0,
  placeholder,
  ref,
}: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => inputRef.current?.focus(),
      clear: () => setText(''),
    }),
    [],
  );

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    try {
      await onSubmit(trimmed);
      setText('');
      // Deliberately keep focus: chat-style "post and keep typing".
    } catch (err: any) {
      // Previously this rejection escaped handleSend and became an unhandled
      // promise rejection, silently leaving the draft in place with no feedback.
      Alert.alert(t('common.error'), err?.message ?? t('community.commentFailed'));
    } finally {
      setLoading(false);
    }
  };

  const hasText = text.trim().length > 0;

  return (
    <View
      className="border-t"
      style={{
        borderColor: Colors.border.default,
        backgroundColor: Colors.background.dark,
        // STATIC safe-area padding — see hooks/useKeyboardOffsets.ts.
        // Do not toggle this on keyboard show/hide.
        paddingBottom: bottomInset,
      }}
    >
      {replyTo ? (
        <View className="flex-row items-center px-3 pt-2">
          <Text
            numberOfLines={1}
            className="flex-1 text-xs"
            style={{ color: Colors.text.tertiary }}
          >
            {t('community.replyingTo', {
              name: replyToName || t('community.defaultUser'),
            })}
          </Text>
          <TouchableOpacity
            onPress={onCancelReply}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('community.cancelReply')}
            className="p-1"
            // marginStart (not ml-2) so it flips correctly under RTL.
            style={{ marginStart: 8 }}
            activeOpacity={0.7}
          >
            <X size={14} color={Colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      ) : null}

      <View className="flex-row items-center px-3 py-2">
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder={
            placeholder ??
            (replyTo
              ? t('community.replyPlaceholder')
              : t('community.commentPlaceholder'))
          }
          placeholderTextColor={Colors.text.muted}
          multiline
          maxLength={1000}
          className="flex-1 rounded-2xl px-4 py-2 text-sm"
          style={{
            backgroundColor: Colors.background.medium,
            color: Colors.text.primary,
            maxHeight: 100,
          }}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!hasText || loading}
          accessibilityRole="button"
          accessibilityLabel={t('community.post')}
          className="p-2 rounded-full"
          style={{
            marginStart: 8,
            backgroundColor: hasText ? Colors.darkGold : Colors.background.medium,
          }}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Send size={18} color={hasText ? '#fff' : Colors.text.tertiary} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
