import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { Copy, Flag, RotateCcw, Trash2 } from 'lucide-react-native';
import React, { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import type { ChatMessage } from '@/types/social';
import { bubbleRadii, type BubbleLayout } from '@/utils/chat.core';
import { clockTime } from '@/components/Media/time';
import ActionSheet, { type SheetAction } from './ActionSheet';
import EmbedCard from './EmbedCard';
import ReceiptGlyph from './ReceiptGlyph';
import T from './T';

interface Props {
  message: ChatMessage;
  layout: BubbleLayout;
  onRetry: (m: ChatMessage) => void;
  onDiscard: (m: ChatMessage) => void;
  onReport: (m: ChatMessage) => void;
  onOpenPhoto: (uri: string) => void;
}

/**
 * One message.
 *
 * Mine: gold ground with DARK text (white on #BC9045 fails AA at 2.91:1),
 * trailing side. Theirs: card ground with the load-bearing 1px border, leading
 * side. Corners are logical (start/end) so the tail flips with the language by
 * itself — see `bubbleRadii`.
 *
 * The bubble never animates in. The receipt glyph under the last bubble of a
 * run is the only thing that moves.
 */
function MessageBubble({ message, layout, onRetry, onDiscard, onReport, onOpenPhoto }: Props) {
  const { t } = useTranslation();
  const [menu, setMenu] = useState(false);
  const { mine } = layout;
  const removed = message.status === 'removed';
  const failed = message.receipt === 'failed';
  const fg = mine ? Colors.text.dark : Colors.text.primary;

  const actions: SheetAction[] = [];
  if (failed) {
    actions.push({ key: 'retry', label: t('social.thread.retry'), icon: <RotateCcw size={20} color={Colors.darkGold} />, onPress: () => onRetry(message) });
    actions.push({ key: 'discard', label: t('social.thread.discard'), icon: <Trash2 size={20} color={Colors.status.error} />, destructive: true, onPress: () => onDiscard(message) });
  }
  if (!removed && message.body) {
    actions.push({ key: 'copy', label: t('social.thread.copy'), icon: <Copy size={20} color={Colors.darkGold} />, onPress: () => void Clipboard.setStringAsync(message.body ?? '') });
  }
  if (!mine && !removed) {
    actions.push({ key: 'report', label: t('social.thread.report'), icon: <Flag size={20} color={Colors.status.error} />, destructive: true, onPress: () => onReport(message) });
  }

  const time = clockTime(message.created_at);
  const showMeta = !layout.joinsNext || failed;

  return (
    <View
      style={{
        paddingHorizontal: 12,
        marginTop: layout.joinsPrevious ? 2 : 10,
        alignItems: mine ? 'flex-end' : 'flex-start',
      }}
    >
      <Touchable
        onLongPress={() => actions.length && setMenu(true)}
        onPress={failed ? () => setMenu(true) : undefined}
        delayLongPress={280}
        accessibilityRole="text"
        accessibilityLabel={removed ? t('social.thread.removed') : message.body ?? t(`social.preview.${message.kind === 'image' ? 'photo' : 'share'}`)}
        accessibilityHint={actions.length ? t('social.thread.longPressHint') : undefined}
        style={() => ({
          maxWidth: '80%',
          ...bubbleRadii(layout),
          backgroundColor: removed ? 'transparent' : mine ? Colors.darkGold : Colors.background.card,
          borderWidth: removed || !mine ? 1 : 0,
          borderColor: Colors.border.default,
          opacity: message.receipt === 'pending' ? 0.85 : 1,
          overflow: 'hidden',
        })}
      >
        {removed ? (
          <T step="footnote" color={Colors.text.tertiary} style={{ paddingHorizontal: 12, paddingVertical: 8, fontStyle: 'italic' }}>
            {t('social.thread.removed')}
          </T>
        ) : (
          <>
            {message.attachments.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
                {message.attachments.map((a) => {
                  const uri = a.url ?? a.local_uri ?? null;
                  const single = message.attachments.length === 1;
                  const w = single ? 232 : 115;
                  const ratio = single && a.width && a.height ? Math.min(1.4, Math.max(0.6, a.height / a.width)) : 1;
                  return (
                    <Touchable key={a.id} onPress={() => uri && onOpenPhoto(uri)} accessibilityRole="imagebutton" accessibilityLabel={t('social.preview.photo')}>
                      <Image
                        source={uri ? { uri } : undefined}
                        style={{ width: w, height: Math.round(w * ratio), backgroundColor: Colors.background.medium }}
                        contentFit="cover"
                        transition={120}
                      />
                    </Touchable>
                  );
                })}
              </View>
            ) : null}
            {message.embed ? (
              <View style={{ padding: 4 }}>
                <EmbedCard embed={message.embed} mine={mine} />
              </View>
            ) : null}
            {message.body ? (
              <T step="body" color={fg} selectable style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 }}>
                {message.body}
              </T>
            ) : null}
          </>
        )}
      </Touchable>

      {showMeta ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, paddingHorizontal: 4 }}>
          {failed ? (
            <T step="caption" color={Colors.status.error} style={{ marginEnd: 4 }}>
              {t('social.thread.notSent')}
            </T>
          ) : time ? (
            <T step="caption" color={Colors.text.muted} ltr style={{ marginEnd: mine ? 4 : 0 }}>
              {time}
            </T>
          ) : null}
          {mine && message.receipt ? <ReceiptGlyph state={message.receipt} /> : null}
        </View>
      ) : null}

      <ActionSheet visible={menu} onClose={() => setMenu(false)} cancelLabel={t('common.cancel')} actions={actions} />
    </View>
  );
}

export default memo(MessageBubble);
