import { useRouter, type Href } from 'expo-router';
import React, { memo } from 'react';
import { View } from 'react-native';

import { relativeTime } from '@/components/Media/time';
import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import NotificationService from '@/services/NotificationService';
import type { InboxNotification } from '@/types/media/notifications';
import { hrefFromPayload } from '@/utils/pushPayload';

interface Props {
  notification: InboxNotification;
  onRead: (id: string) => void;
}

/** One inbox row. Unread rows carry a gold dot and a slightly lifted background. */
function NotificationRow({ notification, onRead }: Props) {
  const router = useRouter();
  const unread = !notification.read_at;

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
      accessibilityLabel={notification.title ?? undefined}
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
          {notification.title ?? ''}
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
