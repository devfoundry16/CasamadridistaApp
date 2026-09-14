import { useRouter } from 'expo-router';
import { Send } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { useUnreadMessages } from '@/hooks/social/useInbox';
import { useUser } from '@/hooks/useUser';
import { badgeText } from '@/utils/chat.core';

/**
 * Messages, in the global header — not a sixth tab.
 *
 * `(tabs)/_layout.tsx` records that six visible tabs truncate the labels, and a
 * speech bubble is already Community's icon. A paper plane with an unread
 * badge, beside the bell, is the Messages entry point. Requests count toward
 * the badge: somebody is waiting for an answer.
 */
export default function MessagesButton() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useUser();
  const { data } = useUnreadMessages();

  if (!user?.id) return null;

  const count = (data?.inbox ?? 0) + (data?.requests ?? 0);
  const badge = badgeText(count);

  return (
    <Touchable
      onPress={() => router.push('/social/messages')}
      accessibilityRole="button"
      accessibilityLabel={count ? t('social.inbox.buttonWithCount', { count }) : t('social.inbox.title')}
      hitSlop={8}
      style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.6 : 1 })}
    >
      <View>
        <Send color={Colors.text.primary} size={21} />
        {badge ? (
          <View
            style={{
              position: 'absolute',
              top: -4,
              // `end`, not `right`: the badge sits on the trailing corner in both directions.
              end: -6,
              minWidth: 16,
              height: 16,
              paddingHorizontal: 3,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: Colors.status.error,
            }}
          >
            <Text style={{ color: Colors.textWhite, fontSize: 9, fontWeight: '700', writingDirection: 'ltr' }}>{badge}</Text>
          </View>
        ) : null}
      </View>
    </Touchable>
  );
}
