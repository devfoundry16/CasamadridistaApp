import { useRouter, type Href } from 'expo-router';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { relativeTime } from '@/components/Media/time';
import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import NotificationService from '@/services/NotificationService';
import type { InboxNotification, PushPayloadType } from '@/types/media/notifications';
import { safetyNoticeKey } from '@/utils/appeals.core';
import { hrefFromPayload } from '@/utils/pushPayload';

/** Payload types whose title is rebuilt from `actor_name` in the reader's language. */
const LOCALISED_TYPES = new Set<PushPayloadType>([
  'friend_request',
  'friend_accept',
  'post_like',
  'post_comment',
  'mention',
  'tag',
]);

interface Props {
  notification: InboxNotification;
  onRead: (id: string) => void;
}

/** One inbox row. Unread rows carry a gold dot and a slightly lifted background. */
function NotificationRow({ notification, onRead }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const unread = !notification.read_at;

  // Social rows are localised from their payload; the stored title is English
  // for clients that render it verbatim.
  const type = notification.data?.type;
  const actor = notification.data?.actor_name;
  // A mention made in a comment says so; one in the post itself does not. A
  // comment answering the recipient's own comment reads as a reply.
  const key =
    type === 'mention' && notification.data?.comment_id
      ? 'mention_comment'
      : type === 'post_comment' && notification.data?.reply === true
        ? 'post_comment_reply'
        : type;
  // A safety notice is titled from its subtype; the body carries the
  // reviewer's note as written.
  const noticeKey = type === 'safety_notice' ? safetyNoticeKey(notification.data?.subtype) : null;
  const title = noticeKey
    ? t(noticeKey)
    : type && LOCALISED_TYPES.has(type) && actor
      ? t(`social.notifications.${key}`, { name: actor })
      : notification.title ?? '';

  const handlePress = () => {
    if (unread) onRead(notification.id);
    void NotificationService.recordOpened({
      campaign_id: notification.data?.campaign_id,
      item_id: notification.data?.item_id,
    });
    const href = hrefFromPayload(notification.data);
    if (href) router.push(href as Href);
  };

  return (
    <Touchable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={title || undefined}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
        backgroundColor: pressed
          ? Colors.background.card
          : unread
            ? 'rgba(188,144,69,0.08)'
            : 'transparent',
      })}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          marginEnd: 10,
          backgroundColor: unread ? Colors.darkGold : 'transparent',
        }}
      />

      {/*
        No thumbnail: the `notifications` table has no image column, and the
        push payload carries ids rather than URLs. Fetching a cover per row
        would be a request per row for decoration, so the row is text-only.
      */}

      <View style={{ flex: 1 }}>
        <Text
          className="text-[14px] font-semibold"
          style={{ color: Colors.text.primary }}
          numberOfLines={2}
        >
          {title}
        </Text>
        {notification.body ? (
          <Text
            className="text-[12px] leading-4"
            style={{ color: Colors.text.tertiary, marginTop: 2 }}
            numberOfLines={2}
          >
            {notification.body}
          </Text>
        ) : null}
        <Text className="text-[11px]" style={{ color: Colors.text.muted, marginTop: 4 }}>
          {relativeTime(notification.created_at) ?? ''}
        </Text>
      </View>
    </Touchable>
  );
}

export default memo(NotificationRow);
