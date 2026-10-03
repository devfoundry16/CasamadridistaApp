import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { Copy, EyeOff, Flag, Play, Reply, RotateCcw, SmilePlus, Trash2, Undo2 } from 'lucide-react-native';
import React, { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Pressable, View } from 'react-native';

import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import type { ChatMessage, MessageQuote } from '@/types/social';
import { bubbleRadii, formatDuration, messageActions, REACTIONS, unsentCopy, type BubbleLayout } from '@/utils/chat.core';
import { clockTime } from '@/components/Media/time';
import ActionSheet, { type SheetAction } from './ActionSheet';
import EmbedCard from './EmbedCard';
import ReceiptGlyph from './ReceiptGlyph';
import RichText from './RichText';
import T from './T';
import VoiceBubble from './VoiceBubble';

interface Props {
  message: ChatMessage;
  layout: BubbleLayout;
  myId: string;
  /** The other person's first name, for a quote of their message. */
  otherName: string;
  onRetry: (m: ChatMessage) => void;
  onDiscard: (m: ChatMessage) => void;
  onReport: (m: ChatMessage) => void;
  onOpenPhoto: (uri: string, m: ChatMessage) => void;
  onOpenVideo: (uri: string, m: ChatMessage) => void;
  onReact: (m: ChatMessage, emoji: string | null) => void;
  onReply: (m: ChatMessage) => void;
  onHide: (m: ChatMessage) => void;
  onUnsend: (m: ChatMessage) => void;
}

/**
 * One message.
 *
 * Mine: gold ground with DARK text (white on #BC9045 fails AA at 2.91:1),
 * trailing side. Theirs: card ground with the load-bearing 1px border, leading
 * side. Corners are logical (start/end) so the tail flips with the language by
 * itself — see `bubbleRadii`.
 *
 * Long-press opens the menu (`messageActions`): React, Reply, Copy, Delete for
 * me, Unsend (mine) or Report (theirs). The bubble never animates in.
 */
function MessageBubble({ message, layout, myId, otherName, onRetry, onDiscard, onReport, onOpenPhoto, onOpenVideo, onReact, onReply, onHide, onUnsend }: Props) {
  const { t } = useTranslation();
  const [menu, setMenu] = useState(false);
  const [picking, setPicking] = useState(false);
  const { mine } = layout;
  const removed = message.status === 'removed';
  const unsent = message.status === 'unsent';
  const gone = removed || unsent;
  const failed = message.receipt === 'failed';
  const fg = mine ? Colors.text.dark : Colors.text.primary;

  const confirm = (title: string, body: string, label: string, run: () => void) =>
    Alert.alert(title, body, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: label, style: 'destructive', onPress: run },
    ]);

  const actions: SheetAction[] = [];
  if (failed) {
    actions.push({ key: 'retry', label: t('social.thread.retry'), icon: <RotateCcw size={20} color={Colors.darkGold} />, onPress: () => onRetry(message) });
    actions.push({ key: 'discard', label: t('social.thread.discard'), icon: <Trash2 size={20} color={Colors.status.error} />, destructive: true, onPress: () => onDiscard(message) });
  }
  for (const key of messageActions(message, myId)) {
    if (key === 'react') actions.push({ key, label: t('social.thread.react'), icon: <SmilePlus size={20} color={Colors.darkGold} />, onPress: () => setPicking(true) });
    if (key === 'reply') actions.push({ key, label: t('social.thread.reply'), icon: <Reply size={20} color={Colors.darkGold} />, onPress: () => onReply(message) });
    if (key === 'copy') actions.push({ key, label: t('social.thread.copy'), icon: <Copy size={20} color={Colors.darkGold} />, onPress: () => void Clipboard.setStringAsync(message.body ?? '') });
    if (key === 'hide') {
      actions.push({
        key,
        label: t('social.thread.deleteForMe'),
        icon: <EyeOff size={20} color={Colors.status.error} />,
        destructive: true,
        onPress: () => confirm(t('social.thread.deleteForMeTitle'), t('social.thread.deleteForMeBody'), t('social.thread.deleteForMe'), () => onHide(message)),
      });
    }
    if (key === 'unsend') {
      actions.push({
        key,
        label: t('social.thread.unsendAction'),
        icon: <Undo2 size={20} color={Colors.status.error} />,
        destructive: true,
        onPress: () => confirm(t('social.thread.unsendTitle'), t('social.thread.unsendBody'), t('social.thread.unsendAction'), () => onUnsend(message)),
      });
    }
    if (key === 'report') actions.push({ key, label: t('social.thread.report'), icon: <Flag size={20} color={Colors.status.error} />, destructive: true, onPress: () => onReport(message) });
  }

  const time = clockTime(message.created_at);
  const showMeta = !layout.joinsNext || failed;
  const voice = message.kind === 'voice' ? message.attachments[0] : undefined;
  const video = message.kind === 'video' ? message.attachments[0] : undefined;
  const photos = message.kind === 'image' ? message.attachments : [];

  const label = gone
    ? t(removed ? 'social.thread.removed' : unsentCopy(message, myId))
    : message.body ?? t(`social.preview.${message.kind === 'image' ? 'photo' : message.kind === 'voice' ? 'voice' : message.kind === 'video' ? 'video' : 'share'}`);

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
        accessibilityLabel={label}
        accessibilityHint={actions.length ? t('social.thread.longPressHint') : undefined}
        style={() => ({
          maxWidth: '80%',
          ...bubbleRadii(layout),
          backgroundColor: gone ? 'transparent' : mine ? Colors.darkGold : Colors.background.card,
          borderWidth: gone || !mine ? 1 : 0,
          borderColor: Colors.border.default,
          opacity: message.receipt === 'pending' ? 0.85 : 1,
          overflow: 'hidden',
        })}
      >
        {gone ? (
          <T step="footnote" color={Colors.text.tertiary} style={{ paddingHorizontal: 12, paddingVertical: 8, fontStyle: 'italic' }}>
            {label}
          </T>
        ) : (
          <>
            {message.reply_to ? <Quote quote={message.reply_to} mine={mine} myId={myId} otherName={otherName} /> : null}
            {photos.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
                {photos.map((a) => {
                  const uri = a.url ?? a.local_uri ?? null;
                  const single = photos.length === 1;
                  const w = single ? 232 : 115;
                  const ratio = single && a.width && a.height ? Math.min(1.4, Math.max(0.6, a.height / a.width)) : 1;
                  return (
                    <Touchable key={a.id} onPress={() => uri && onOpenPhoto(uri, message)} accessibilityRole="imagebutton" accessibilityLabel={t('social.preview.photo')}>
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
            {/* The local file first: it never changes, so a refetch's new
                signed URL does not restart the player. */}
            {voice ? <VoiceBubble uri={voice.local_uri ?? voice.url ?? null} durationMs={voice.duration_ms ?? null} mine={mine} /> : null}
            {video ? (
              <Touchable
                onPress={() => {
                  const uri = video.local_uri ?? video.url;
                  if (uri) onOpenVideo(uri, message);
                }}
                accessibilityRole="button"
                accessibilityLabel={t('social.thread.playVideo')}
              >
                <View style={{ width: 200, height: Math.round(200 * (video.width && video.height ? Math.min(1.6, Math.max(0.6, video.height / video.width)) : 1.4)), backgroundColor: '#000' }}>
                  {video.thumbnail_url ? (
                    <Image source={{ uri: video.thumbnail_url }} style={{ flex: 1 }} contentFit="cover" transition={120} />
                  ) : null}
                  <View style={{ position: 'absolute', top: 0, bottom: 0, start: 0, end: 0, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                      <Play size={22} color="#fff" fill="#fff" />
                    </View>
                  </View>
                  {video.duration_ms ? (
                    <T step="caption" color="#fff" ltr style={{ position: 'absolute', bottom: 6, end: 8 }}>
                      {formatDuration(video.duration_ms)}
                    </T>
                  ) : null}
                </View>
              </Touchable>
            ) : null}
            {message.embed ? (
              <View style={{ padding: 4 }}>
                <EmbedCard embed={message.embed} mine={mine} />
              </View>
            ) : null}
            {message.body ? (
              <RichText text={message.body} step="body" color={fg} onLongPress={() => { if (actions.length) setMenu(true); }} style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 }} />
            ) : null}
          </>
        )}
      </Touchable>

      {!gone && message.reactions.counts.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: -4, paddingHorizontal: 6 }}>
          {message.reactions.counts.map((r) => {
            const own = message.reactions.mine === r.emoji;
            return (
              <Touchable
                key={r.emoji}
                onPress={() => onReact(message, own ? null : r.emoji)}
                accessibilityRole="button"
                accessibilityState={{ selected: own }}
                accessibilityLabel={t('social.thread.reactionCount', { emoji: r.emoji, count: r.count })}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: own ? Colors.darkGold : Colors.border.default,
                  backgroundColor: Colors.background.deepDark,
                }}
              >
                <T step="caption">{r.emoji}</T>
                {r.count > 1 ? (
                  <T step="caption" color={Colors.text.secondary} ltr>
                    {r.count}
                  </T>
                ) : null}
              </Touchable>
            );
          })}
        </View>
      ) : null}

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
          {mine && message.receipt && !gone ? <ReceiptGlyph state={message.receipt} /> : null}
        </View>
      ) : null}

      <ActionSheet visible={menu} onClose={() => setMenu(false)} cancelLabel={t('common.cancel')} actions={actions} />

      <Modal visible={picking} transparent animationType="fade" onRequestClose={() => setPicking(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }} onPress={() => setPicking(false)}>
          <View
            accessibilityRole="menu"
            style={{ flexDirection: 'row', gap: 6, padding: 10, borderRadius: 28, backgroundColor: Colors.background.card, borderWidth: 1, borderColor: Colors.border.default }}
          >
            {REACTIONS.map((emoji) => (
              <Touchable
                key={emoji}
                onPress={() => {
                  setPicking(false);
                  onReact(message, emoji);
                }}
                accessibilityRole="menuitem"
                accessibilityLabel={t('social.thread.reactWith', { emoji })}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: message.reactions.mine === emoji ? Colors.background.light : 'transparent',
                }}
              >
                <T style={{ fontSize: 26, lineHeight: 32 }}>{emoji}</T>
              </Touchable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

/** The original a reply quotes: who wrote it and a line of it. */
function Quote({ quote, mine, myId, otherName }: { quote: MessageQuote; mine: boolean; myId: string; otherName: string }) {
  const { t } = useTranslation();
  const who = quote.sender_id === myId ? t('social.thread.you') : otherName;
  const what =
    quote.status !== 'visible'
      ? t('social.thread.quoteUnavailable')
      : quote.body ?? t(`social.preview.${quote.kind === 'image' ? 'photo' : quote.kind === 'voice' ? 'voice' : quote.kind === 'video' ? 'video' : 'share'}`);
  return (
    <View
      style={{
        margin: 4,
        marginBottom: 0,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 10,
        borderStartWidth: 3,
        borderStartColor: mine ? Colors.text.dark : Colors.darkGold,
        backgroundColor: mine ? 'rgba(26,26,26,0.12)' : Colors.background.medium,
      }}
    >
      <T step="caption" weight="semibold" color={mine ? Colors.text.dark : Colors.darkGold} numberOfLines={1}>
        {who}
      </T>
      <T step="footnote" color={mine ? Colors.text.dark : Colors.text.secondary} numberOfLines={2}>
        {what}
      </T>
    </View>
  );
}

export default memo(MessageBubble);
