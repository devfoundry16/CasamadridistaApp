import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ban, Flag, MessageCircleOff } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, View } from 'react-native';

import Avatar from '@/components/Social/Avatar';
import Composer from '@/components/Social/Composer';
import MessageBubble from '@/components/Social/MessageBubble';
import PhotoModal from '@/components/Social/PhotoModal';
import SocialButton from '@/components/Social/SocialButton';
import SocialReportSheet from '@/components/Social/SocialReportSheet';
import T from '@/components/Social/T';
import EmptyState from '@/components/Team/EmptyState';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { socialKeys } from '@/hooks/social/keys';
import { usePresence } from '@/hooks/social/usePresence';
import { useRelationshipAction } from '@/hooks/social/useProfile';
import { useThread } from '@/hooks/social/useThread';
import { useKeyboardOffsets } from '@/hooks/useKeyboardOffsets';
import { useUser } from '@/hooks/useUser';
import SocialService from '@/services/SocialService';
import type { ChatMessage } from '@/types/social';
import { bubbleLayout } from '@/utils/chat.core';

/**
 * A conversation (§10–§13).
 *
 * The app's first inverted FlatList: index 0 is the newest message and renders
 * at the bottom, so the list opens at the latest message and older pages load
 * as you scroll up. The thread sits on the darkest ground — a room you enter —
 * with my bubbles in gold and theirs on the bordered card.
 */
export default function ChatScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const myId = user?.id;
  const { keyboardVerticalOffset, bottomInset } = useKeyboardOffsets();
  const [focused, setFocused] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ kind: 'message' | 'profile'; id: string } | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const header = useQuery({
    queryKey: socialKeys.conversation(id ?? ''),
    queryFn: () => SocialService.conversation(id!),
    enabled: !!id && !!myId,
  });
  const conversation = header.data;
  const other = conversation?.other;
  const block = useRelationshipAction(other?.id ?? '');
  const thread = useThread(conversation ? id : undefined, myId, focused);
  const presence = usePresence(other?.id, null);

  const layouts = useMemo(() => thread.messages.map((_, i) => bubbleLayout(thread.messages, i, myId ?? '')), [thread.messages, myId]);

  const accept = async () => {
    if (!id) return;
    await SocialService.acceptRequest(id);
    void header.refetch();
    void queryClient.invalidateQueries({ queryKey: socialKeys.inbox('requests') });
    void queryClient.invalidateQueries({ queryKey: socialKeys.inbox('inbox') });
    void queryClient.invalidateQueries({ queryKey: socialKeys.unread() });
  };

  const remove = () =>
    Alert.alert(t('social.thread.deleteRequestTitle'), t('social.thread.deleteRequestBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('social.thread.delete'),
        style: 'destructive',
        onPress: async () => {
          if (!id) return;
          await SocialService.hide(id);
          void queryClient.invalidateQueries({ queryKey: socialKeys.inbox('requests') });
          void queryClient.invalidateQueries({ queryKey: socialKeys.unread() });
          router.back();
        },
      },
    ]);

  const confirmBlock = () =>
    other &&
    Alert.alert(t('social.confirm.blockTitle', { name: other.name }), t('social.confirm.blockBody', { name: other.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('social.actions.block'),
        style: 'destructive',
        onPress: () =>
          block.mutate('block', {
            onSuccess: () => {
              void queryClient.invalidateQueries({ queryKey: socialKeys.inbox('inbox') });
              router.back();
            },
          }),
      },
    ]);

  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => {
      const layout = layouts[index];
      return (
        <View>
          {/* Each cell of an inverted list is itself un-flipped, so JSX order is
              visual order: the separator sits above the day's first message. */}
          {layout.startsDay ? <DaySeparator iso={item.created_at} /> : null}
          <MessageBubble
            message={item}
            layout={layout}
            onRetry={thread.retry}
            onDiscard={thread.discard}
            onReport={(m) => setReportTarget({ kind: 'message', id: m.id })}
            onOpenPhoto={setPhoto}
          />
        </View>
      );
    },
    [layouts, thread.retry, thread.discard],
  );

  const titleNode = other ? (
    <Touchable onPress={() => router.push(`/user/${other.id}`)} accessibilityRole="button" accessibilityLabel={t('social.thread.openProfile', { name: other.name })} style={{ flexDirection: 'row', alignItems: 'center', maxWidth: 240 }}>
      <Avatar uri={other.avatar_url} name={other.name} size={32} online={presence?.key === 'online'} />
      <View style={{ marginStart: 8, flexShrink: 1 }}>
        <T step="body" weight="bold" numberOfLines={1}>
          {other.name}
        </T>
        {thread.otherTyping ? (
          <T step="caption" color={Colors.text.primary}>
            {t('social.thread.typing')}
          </T>
        ) : presence ? (
          <T step="caption" color={Colors.text.primary} style={{ opacity: 0.85 }}>
            {presence.key === 'online' ? t('social.presence.online') : t(`social.presence.${presence.key}`, { count: presence.value })}
          </T>
        ) : null}
      </View>
    </Touchable>
  ) : null;

  const screen = (
    <Stack.Screen
      options={{
        headerTitle: () => titleNode,
        headerRight: other
          ? () => (
              <Touchable onPress={() => setReportTarget({ kind: 'profile', id: other.id })} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('social.profile.report')} style={{ padding: 6 }}>
                <Flag size={19} color={Colors.text.primary} />
              </Touchable>
            )
          : undefined,
      }}
    />
  );

  if (header.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background.dark }}>
        {screen}
        <ActivityIndicator color={Colors.darkGold} />
      </View>
    );
  }

  if (!conversation) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background.dark }}>
        {screen}
        <EmptyState icon={MessageCircleOff} title={t('social.thread.unavailableTitle')} body={t('social.thread.unavailableBody')} />
      </View>
    );
  }

  const disabledReason = conversation.can_write
    ? null
    : conversation.write_blocked_reason === 'you_blocked'
      ? t('social.thread.youBlocked', { name: conversation.other.name })
      : t('social.thread.cannotReply');

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.background.dark }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={keyboardVerticalOffset}>
      {screen}

      {conversation.is_request ? (
        <View style={{ padding: 16, borderBottomWidth: 1, borderColor: Colors.border.default, backgroundColor: Colors.background.deepDark }}>
          <T step="footnote" color={Colors.text.secondary}>
            {t('social.thread.requestBanner', { name: conversation.other.name })}
          </T>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <SocialButton flex label={t('social.actions.accept')} tone="gold" onPress={() => void accept()} />
            <SocialButton flex label={t('social.thread.delete')} tone="outline" onPress={remove} />
            <SocialButton label={t('social.actions.block')} tone="destructive" icon={<Ban size={14} color={Colors.status.error} />} onPress={confirmBlock} />
          </View>
        </View>
      ) : null}

      {thread.loading ? (
        <ActivityIndicator color={Colors.darkGold} style={{ flex: 1 }} />
      ) : (
        <FlatList
          inverted
          data={thread.messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          onEndReached={thread.loadOlder}
          onEndReachedThreshold={0.3}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={{ paddingVertical: 12, flexGrow: 1 }}
          ListFooterComponent={thread.loadingOlder ? <ActivityIndicator color={Colors.darkGold} style={{ margin: 12 }} /> : null}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, transform: [{ scaleY: -1 }] }}>
              <Avatar uri={conversation.other.avatar_url} name={conversation.other.name} size={72} />
              <T step="headline" weight="bold" style={{ marginTop: 12 }}>
                {conversation.other.name}
              </T>
              <T step="footnote" color={Colors.text.tertiary} align="center" style={{ marginTop: 4 }}>
                {t('social.thread.emptyBody')}
              </T>
            </View>
          }
        />
      )}

      {thread.error && thread.error !== 'network_error' ? (
        <Touchable onPress={thread.clearError} accessibilityRole="button" style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(239,68,68,0.12)' }}>
          <T step="footnote" color={Colors.status.error} align="center">
            {t(`social.errors.${thread.error}`, { defaultValue: t('social.errors.generic') })}
          </T>
        </Touchable>
      ) : null}

      <Composer onSend={thread.send} onTyping={thread.notifyTyping} bottomInset={bottomInset} disabledReason={disabledReason} />

      <SocialReportSheet visible={!!reportTarget} target={reportTarget} onClose={() => setReportTarget(null)} onBlock={confirmBlock} />
      <PhotoModal uri={photo} onClose={() => setPhoto(null)} />
    </KeyboardAvoidingView>
  );
}

function DaySeparator({ iso }: { iso: string }) {
  const { t, i18n } = useTranslation();
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  let label: string;
  if (same(date, today)) label = t('social.thread.today');
  else if (same(date, yesterday)) label = t('social.thread.yesterday');
  else {
    try {
      label = date.toLocaleDateString(i18n.language, { weekday: 'short', day: 'numeric', month: 'short', ...(date.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}) });
    } catch {
      label = date.toDateString();
    }
  }
  return (
    <View style={{ alignItems: 'center', marginVertical: 14 }}>
      <T step="caption" weight="semibold" color={Colors.text.muted}>
        {label}
      </T>
    </View>
  );
}
