import { Bell } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';

import NotificationRow from '@/components/Notifications/NotificationRow';
import EmptyState from '@/components/Team/EmptyState';
import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { useInbox } from '@/hooks/notifications/useInbox';
import { useUser } from '@/hooks/useUser';

/** The notification inbox. */
export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { user } = useUser();
  const {
    notifications,
    unreadCount,
    markOneRead,
    markAllRead,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInbox();

  if (!user?.id) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>
        <EmptyState
          icon={Bell}
          title={t('notifications.signedOutTitle')}
          body={t('notifications.signedOutBody')}
        />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.background.deepDark,
        }}
      >
        <ActivityIndicator size="large" color={Colors.darkGold} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>
      {unreadCount > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border.default,
          }}
        >
          <Text className="text-[12px]" style={{ flex: 1, color: Colors.text.tertiary }}>
            {t('notifications.unreadCount', { value: unreadCount })}
          </Text>
          <Touchable
            onPress={markAllRead}
            accessibilityRole="button"
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text className="text-[12px] font-semibold" style={{ color: Colors.darkGold }}>
              {t('notifications.markAllRead')}
            </Text>
          </Touchable>
        </View>
      ) : null}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationRow notification={item} onRead={markOneRead} />
        )}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.6}
        windowSize={5}
        removeClippedSubviews
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.darkGold}
            colors={[Colors.darkGold]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon={Bell}
            title={t('notifications.emptyTitle')}
            body={t('notifications.emptyBody')}
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator color={Colors.darkGold} />
            </View>
          ) : null
        }
      />
    </View>
  );
}
