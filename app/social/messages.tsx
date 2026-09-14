import { Stack, useRouter } from 'expo-router';
import { MessageCircle, SquarePen } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';

import ConversationRow from '@/components/Social/ConversationRow';
import SegmentTab from '@/components/Social/SegmentTab';
import T from '@/components/Social/T';
import EmptyState from '@/components/Team/EmptyState';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { useInbox, useUnreadMessages } from '@/hooks/social/useInbox';
import { useUser } from '@/hooks/useUser';

/**
 * Messages (§10–§12): conversations you have accepted, and message requests
 * from people who are not your friends yet.
 */
export default function MessagesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useUser();
  const [box, setBox] = useState<'inbox' | 'requests'>('inbox');
  const inbox = useInbox(box);
  const { data: unread } = useUnreadMessages();

  const conversations = inbox.data?.pages.flatMap((p) => p.conversations) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.medium }}>
      <Stack.Screen
        options={{
          title: t('social.inbox.title'),
          headerRight: () => (
            <Touchable onPress={() => router.push('/social/friends')} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('social.inbox.newMessage')} style={{ padding: 6 }}>
              <SquarePen size={21} color={Colors.text.primary} />
            </Touchable>
          ),
        }}
      />

      <View style={{ flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1, borderColor: Colors.border.default }}>
        <SegmentTab label={t('social.inbox.tabInbox')} on={box === 'inbox'} onPress={() => setBox('inbox')} />
        <SegmentTab label={t('social.inbox.tabRequests')} count={unread?.requests} on={box === 'requests'} onPress={() => setBox('requests')} />
      </View>

      {box === 'requests' ? (
        <T step="caption" color={Colors.text.tertiary} style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
          {t('social.inbox.requestsHint')}
        </T>
      ) : null}

      {inbox.isLoading ? (
        <ActivityIndicator color={Colors.darkGold} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => <ConversationRow conversation={item} myId={user?.id ?? ''} />}
          onEndReached={() => inbox.hasNextPage && !inbox.isFetchingNextPage && inbox.fetchNextPage()}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={inbox.isRefetching} onRefresh={() => inbox.refetch()} tintColor={Colors.darkGold} colors={[Colors.darkGold]} />}
          ListEmptyComponent={
            <EmptyState
              icon={MessageCircle}
              title={t(box === 'inbox' ? 'social.inbox.emptyTitle' : 'social.inbox.emptyRequestsTitle')}
              body={t(box === 'inbox' ? 'social.inbox.emptyBody' : 'social.inbox.emptyRequestsBody')}
              action={box === 'inbox' ? { label: t('social.inbox.findFriends'), onPress: () => router.push('/social/friends') } : undefined}
            />
          }
          ListFooterComponent={inbox.isFetchingNextPage ? <ActivityIndicator color={Colors.darkGold} style={{ margin: 16 }} /> : null}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}
    </View>
  );
}
