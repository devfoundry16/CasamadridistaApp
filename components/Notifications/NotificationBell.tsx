import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { useUnreadCount } from '@/hooks/notifications/useUnreadCount';

/**
 * Header bell with an unread badge.
 *
 * The badge caps at 9+ — an exact count past that is noise, and a three-digit
 * badge overflows the 18pt dot.
 */
export default function NotificationBell() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: unread = 0 } = useUnreadCount();

  return (
    <Touchable
      onPress={() => router.push('/notifications')}
      accessibilityRole="button"
      accessibilityLabel={
        unread > 0 ? t('notifications.bellWithCount', { value: unread }) : t('notifications.title')
      }
      hitSlop={8}
      style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1 })}
    >
      <View>
        <Bell color={Colors.text.primary} size={22} />
        {unread > 0 ? (
          <View
            style={{
              position: 'absolute',
              top: -4,
              // `end`, not `right`: the badge must sit on the trailing corner in
              // both directions.
              end: -5,
              minWidth: 16,
              height: 16,
              paddingHorizontal: 3,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: Colors.status.error,
            }}
          >
            <Text
              style={{
                color: Colors.textWhite,
                fontSize: 9,
                fontWeight: '700',
                writingDirection: 'ltr',
              }}
            >
              {unread > 9 ? '9+' : String(unread)}
            </Text>
          </View>
        ) : null}
      </View>
    </Touchable>
  );
}
