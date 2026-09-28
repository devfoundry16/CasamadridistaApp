import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, Alert, Linking, type AccessibilityActionEvent } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Text';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Flag, Heart, Trash2 } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import type { Comment } from '@/services/CommentService';
import {
  deleteComment,
  likeComment,
  unlikeComment,
  type CommentTargetKind,
} from '@/services/MediaCommentsAdapter';
import Colors from '@/constants/colors';
import Touchable from '@/components/Touchable';
import ActionSheet, { type SheetAction } from '@/components/Social/ActionSheet';
import RichText from '@/components/Social/RichText';
import ReportSheet from '@/components/Community/Moderation/ReportSheet';
import { useUser } from '@/hooks/useUser';
import { hrefForToken, isSafeUrl, linkTokens, type RichToken } from '@/utils/richText.core';

interface Props {
  comment: Comment;
  onReply?: (comment: Comment) => void;
  /** Which comment table this row belongs to. Defaults to the community feed. */
  targetKind?: CommentTargetKind;
}

const PLACEHOLDER = require('@/assets/images/placeholder_avatar.png');

/**
 * One comment. Long-press opens its actions, the `MessageBubble` pattern:
 * Report on someone else's comment, Delete (with a confirm) on your own.
 *
 * Report exists for Community comments only — Casa Media comments have no
 * report endpoint.
 */
export default function CommentRow({ comment, onReply, targetKind = 'post' }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [liked, setLiked]         = useState(false);
  const [likeCount, setLikeCount] = useState(comment.like_count);
  const [menu, setMenu]           = useState(false);
  const [report, setReport]       = useState(false);

  const handleLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    try {
      if (wasLiked) await unlikeComment(targetKind, comment.id);
      else          await likeComment(targetKind, comment.id);
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
    }
  };

  const authorName = [comment.author?.first_name, comment.author?.last_name]
    .filter(Boolean)
    .join(' ') || t('community.madridista');

  // A commenter's name opens their profile (§20).
  const authorId = comment.author?.id ?? comment.author_id ?? null;
  const openAuthor = () => {
    if (authorId) router.push(`/user/${authorId}`);
  };

  const mine = !!user?.id && authorId === user.id;

  // The links, @mentions and #hashtags in the body. RichText makes them
  // tappable, but inside the row's single accessible element a screen reader
  // cannot reach them, so they come back as actions too.
  const links = useMemo(() => linkTokens(comment.body), [comment.body]);

  const openToken = (token: RichToken) => {
    if (token.type === 'url') {
      // http(s) only, as RichText does.
      if (isSafeUrl(token.value)) Linking.openURL(token.value).catch(() => {});
      return;
    }
    const href = hrefForToken(token);
    if (href) router.push(href as Href);
  };

  const confirmDelete = () =>
    Alert.alert(t('community.deleteCommentTitle'), t('community.deleteCommentBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('community.deleteComment'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(targetKind, comment.id);
            queryClient.invalidateQueries({ queryKey: ['comments', targetKind] });
            // The post's comment count.
            if (targetKind === 'post') queryClient.invalidateQueries({ queryKey: ['post', comment.post_id] });
          } catch (error: any) {
            Alert.alert(t('common.error'), error?.message ?? t('community.deleteCommentFailed'));
          }
        },
      },
    ]);

  const actions: SheetAction[] = [];
  if (!user?.id) {
    // Signed out: nothing to offer.
  } else if (mine) {
    actions.push({ key: 'delete', label: t('community.deleteComment'), icon: <Trash2 size={20} color={Colors.status.error} />, destructive: true, onPress: confirmDelete });
  } else if (targetKind === 'post') {
    actions.push({ key: 'report', label: t('community.reportComment'), icon: <Flag size={20} color={Colors.status.error} />, destructive: true, onPress: () => setReport(true) });
  }

  // The row is one accessible element, which hides the Reply, Like and author
  // buttons inside it from VoiceOver/TalkBack; they come back as actions.
  const a11yActions = [
    ...(onReply ? [{ name: 'reply', label: t('community.reply') }] : []),
    { name: 'like', label: liked ? t('community.unlikeComment') : t('community.likeComment') },
    ...(authorId ? [{ name: 'author', label: t('community.openCommentAuthor', { name: authorName }) }] : []),
    ...(actions.length ? [{ name: 'longpress', label: t('community.commentMoreOptions') }] : []),
    ...links.map((token, i) => ({ name: `link:${i}`, label: token.value })),
  ];

  const onA11yAction = (event: AccessibilityActionEvent) => {
    switch (event.nativeEvent.actionName) {
      case 'reply':     onReply?.(comment); break;
      case 'like':      handleLike(); break;
      case 'author':    openAuthor(); break;
      case 'longpress': if (actions.length) setMenu(true); break;
      default: {
        const [kind, index] = event.nativeEvent.actionName.split(':');
        const token = kind === 'link' ? links[Number(index)] : undefined;
        if (token) openToken(token);
      }
    }
  };

  return (
    <View>
      <Touchable
        onLongPress={() => actions.length && setMenu(true)}
        delayLongPress={280}
        accessibilityLabel={`${authorName}: ${comment.body}`}
        accessibilityHint={actions.length ? t('community.commentLongPressHint') : undefined}
        accessibilityActions={a11yActions}
        onAccessibilityAction={onA11yAction}
        style={({ pressed }) => ({
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderColor: Colors.border.default,
          backgroundColor: pressed && actions.length ? Colors.background.card : 'transparent',
        })}
      >
        <TouchableOpacity onPress={openAuthor} activeOpacity={0.8} disabled={!authorId} accessibilityRole="button" accessibilityLabel={authorName}>
          <Image
            source={comment.author?.avatar_url ? { uri: comment.author.avatar_url } : PLACEHOLDER}
            style={{ width: 32, height: 32, borderRadius: 16 }}
            contentFit="cover"
          />
        </TouchableOpacity>
        {/* marginStart, not ml-2: the avatar must stay on the leading edge in RTL. */}
        <View className="flex-1" style={{ marginStart: 8 }}>
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={openAuthor} activeOpacity={0.8} disabled={!authorId}>
              <Text className="font-semibold text-sm" style={{ color: Colors.text.primary }}>{authorName}</Text>
            </TouchableOpacity>
            <Text className="text-xs" style={{ color: Colors.text.muted }}>
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </Text>
          </View>
          {/* Links, @mentions and #hashtags are tappable; a tap on one does not
              reach the row's long-press. */}
          <RichText
            text={comment.body}
            step="body"
            color={Colors.text.primary}
            linkColor={Colors.darkGold}
            style={{ fontSize: 14, marginTop: 2 }}
          />
          <View className="flex-row items-center mt-1 gap-3">
            <TouchableOpacity onPress={() => onReply?.(comment)} activeOpacity={0.7}>
              <Text className="text-xs" style={{ color: Colors.text.tertiary }}>{t('community.reply')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLike} className="flex-row items-center" activeOpacity={0.7}>
              <Heart
                size={13}
                color={liked ? Colors.status.error : Colors.text.tertiary}
                fill={liked ? Colors.status.error : 'none'}
              />
              {likeCount > 0 && (
                <Text className="text-xs" style={{ color: Colors.text.tertiary, marginStart: 2 }}>{likeCount}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Touchable>

      {/* Siblings of the row, not children: a touch inside a Modal still bubbles
          through the React tree, and must not reach the row's long-press. */}
      <ActionSheet visible={menu} onClose={() => setMenu(false)} cancelLabel={t('common.cancel')} actions={actions} />
      {targetKind === 'post' ? (
        <ReportSheet visible={report} commentId={comment.id} onClose={() => setReport(false)} />
      ) : null}
    </View>
  );
}
