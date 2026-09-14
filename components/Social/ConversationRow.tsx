import { useRouter } from 'expo-router';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { relativeTime } from '@/components/Media/time';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { usePresence } from '@/hooks/social/usePresence';
import type { ConversationSummary } from '@/types/social';
import Avatar from './Avatar';
import ReceiptGlyph from './ReceiptGlyph';
import T from './T';

interface Props {
  conversation: ConversationSummary;
  myId: string;
}

/** One inbox row: who, the last line, when, and an unread count or my receipt. */
function ConversationRow({ conversation, myId }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const presence = usePresence(conversation.other.id, null);
  const last = conversation.last_message;
  const unread = conversation.unread_count > 0;
  const mine = last?.sender_id === myId;

  const preview = last ? previewText(last.preview, t) : '';
  const line = mine && last?.status !== 'removed' ? t('social.preview.you', { text: preview }) : preview;

  return (
    <Touchable
      onPress={() => router.push(`/social/chat/${conversation.id}`)}
      accessibilityRole="button"
      accessibilityLabel={[conversation.other.name, line, unread ? t('social.inbox.unreadCount', { count: conversation.unread_count }) : null].filter(Boolean).join(', ')}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: Colors.background.card }]}
    >
      <Avatar uri={conversation.other.avatar_url} name={conversation.other.name} size={52} online={presence?.key === 'online'} />
      <View style={{ flex: 1, marginStart: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <T step="body" weight={unread ? 'bold' : 'semibold'} numberOfLines={1} style={{ flex: 1 }}>
            {conversation.other.name}
          </T>
          <T step="caption" color={unread ? Colors.darkGold : Colors.text.muted} ltr style={{ marginStart: 8 }}>
            {relativeTime(conversation.last_message_at) ?? ''}
          </T>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
          {mine && last?.receipt ? (
            <View style={{ marginEnd: 4 }}>
              <ReceiptGlyph state={last.receipt} />
            </View>
          ) : null}
          <T
            step="footnote"
            color={unread ? Colors.text.secondary : Colors.text.tertiary}
            weight={unread ? 'semibold' : 'regular'}
            numberOfLines={1}
            style={{ flex: 1, fontStyle: last?.status === 'removed' ? 'italic' : 'normal' }}
          >
            {line}
          </T>
          {unread ? (
            <View style={styles.badge}>
              <T step="caption" weight="bold" color={Colors.text.dark} ltr>
                {conversation.unread_count > 99 ? '99+' : String(conversation.unread_count)}
              </T>
            </View>
          ) : null}
        </View>
      </View>
    </Touchable>
  );
}

export function previewText(preview: { key: string; text: string | null }, t: (k: string, o?: any) => string): string {
  if (preview.key === 'text') return preview.text ?? '';
  const label = t(`social.preview.${preview.key}`, { defaultValue: '' });
  return preview.text ? `${label} · ${preview.text}` : label;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.default,
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginStart: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.darkGold,
  },
});

export default memo(ConversationRow);
