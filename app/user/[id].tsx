import { useInfiniteQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { AtSign, Ban, Flag, MoreHorizontal, UserX } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, RefreshControl, View } from 'react-native';

import PostCard from '@/components/Community/PostCard';
import EmptyState from '@/components/Team/EmptyState';
import Touchable from '@/components/Touchable';
import ActionSheet from '@/components/Social/ActionSheet';
import ProfileHeader from '@/components/Social/ProfileHeader';
import SocialReportSheet from '@/components/Social/SocialReportSheet';
import T from '@/components/Social/T';
import Colors from '@/constants/colors';
import { socialKeys } from '@/hooks/social/keys';
import { useProfile, useRelationshipAction } from '@/hooks/social/useProfile';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useUser } from '@/hooks/useUser';
import SocialService, { SocialApiError } from '@/services/SocialService';
import { isUuid } from '@/utils/pushPayload.core';

/**
 * A person's profile (§1–§5).
 *
 * Routed by user id — `/user/<uuid>` — so an account that never claimed a
 * username still has a working profile. `/user/@handle` also works: it resolves
 * to the id and replaces itself.
 *
 * "They blocked you" and "no such account" render identically: not available.
 */
export default function UserProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id: raw } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const requireAuth = useRequireAuth();
  const [menu, setMenu] = useState(false);
  const [report, setReport] = useState(false);

  const handle = raw?.startsWith('@') ? raw : null;
  const id = raw && isUuid(raw) ? raw : undefined;

  useEffect(() => {
    if (!handle) return;
    void SocialService.resolveHandle(handle).then((resolved) => {
      if (resolved) router.replace(`/user/${resolved}`);
    });
  }, [handle, router]);

  useEffect(() => {
    if (!user?.id) requireAuth({ href: `/user/${raw ?? ''}`, mode: 'login' });
  }, [user?.id, raw, requireAuth]);

  const { data: profile, isLoading, refetch, isRefetching } = useProfile(id);
  const block = useRelationshipAction(id ?? '');

  const posts = useInfiniteQuery({
    queryKey: [...socialKeys.profile(id ?? ''), 'posts'],
    queryFn: ({ pageParam }) => SocialService.userPosts(id!, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last?.nextCursor ?? undefined,
    enabled: !!id && !!profile,
  });
  const postList = posts.data?.pages.flatMap((p) => p?.posts ?? []) ?? [];

  const openChat = useCallback(async () => {
    if (!id) return;
    try {
      const conversation = await SocialService.open(id);
      router.push(`/social/chat/${conversation.id}`);
    } catch (error) {
      const code = error instanceof SocialApiError ? error.code : 'network_error';
      Alert.alert(t('common.error'), t(`social.errors.${code}`, { defaultValue: t('social.errors.generic') }));
    }
  }, [id, router, t]);

  const isSelf = profile?.relationship.state === 'self';
  const name = profile?.user.name ?? '';

  const header = (
    <Stack.Screen
      options={{
        title: profile?.user.username ? `@${profile.user.username}` : t('social.profile.title'),
        headerRight:
          profile && !isSelf
            ? () => (
                <Touchable onPress={() => setMenu(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('social.profile.more')} style={{ padding: 6 }}>
                  <MoreHorizontal size={22} color={Colors.text.primary} />
                </Touchable>
              )
            : undefined,
      }}
    />
  );

  if ((isLoading && id) || handle) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background.medium }}>
        {header}
        <ActivityIndicator color={Colors.darkGold} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background.medium }}>
        {header}
        <EmptyState icon={UserX} title={t('social.profile.unavailableTitle')} body={t('social.profile.unavailableBody')} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.medium }}>
      {header}
      <FlatList
        data={postList}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} />}
        onEndReached={() => posts.hasNextPage && !posts.isFetchingNextPage && posts.fetchNextPage()}
        onEndReachedThreshold={0.6}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch(); void posts.refetch(); }} tintColor={Colors.darkGold} colors={[Colors.darkGold]} />}
        ListHeaderComponent={
          <>
            {isSelf && !profile.user.username ? (
              <Touchable
                onPress={() => router.push('/account/profile')}
                accessibilityRole="button"
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 0, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.darkGold, backgroundColor: pressed ? Colors.background.card : 'rgba(188,144,69,0.08)' })}
              >
                <AtSign size={18} color={Colors.darkGold} />
                <View style={{ flex: 1, marginStart: 10 }}>
                  <T step="footnote" weight="semibold">
                    {t('social.claim.title')}
                  </T>
                  <T step="caption" color={Colors.text.tertiary}>
                    {t('social.claim.body')}
                  </T>
                </View>
              </Touchable>
            ) : null}
            <ProfileHeader profile={profile} onMessage={openChat} />
            {profile.relationship.state === 'blocking' ? (
              <T step="footnote" color={Colors.text.tertiary} align="center" style={{ padding: 24 }}>
                {t('social.profile.youBlocked', { name })}
              </T>
            ) : null}
          </>
        }
        ListEmptyComponent={
          profile.relationship.state === 'blocking' ? null : posts.isLoading ? (
            <ActivityIndicator color={Colors.darkGold} style={{ marginTop: 32 }} />
          ) : (
            <T step="footnote" color={Colors.text.tertiary} align="center" style={{ padding: 32 }}>
              {isSelf ? t('social.profile.noPostsSelf') : t('social.profile.noPosts', { name })}
            </T>
          )
        }
        ListFooterComponent={posts.isFetchingNextPage ? <ActivityIndicator color={Colors.darkGold} style={{ margin: 16 }} /> : null}
        contentContainerStyle={{ paddingBottom: 32 }}
      />

      <ActionSheet
        visible={menu}
        onClose={() => setMenu(false)}
        cancelLabel={t('common.cancel')}
        actions={[
          { key: 'report', label: t('social.profile.report'), icon: <Flag size={20} color={Colors.status.error} />, destructive: true, onPress: () => setReport(true) },
          ...(profile.relationship.state === 'blocking'
            ? []
            : [
                {
                  key: 'block',
                  label: t('social.actions.block'),
                  icon: <Ban size={20} color={Colors.status.error} />,
                  destructive: true,
                  onPress: () =>
                    Alert.alert(t('social.confirm.blockTitle', { name }), t('social.confirm.blockBody', { name }), [
                      { text: t('common.cancel'), style: 'cancel' },
                      { text: t('social.actions.block'), style: 'destructive', onPress: () => block.mutate('block') },
                    ]),
                },
              ]),
        ]}
      />
      <SocialReportSheet
        visible={report}
        target={id ? { kind: 'profile', id } : null}
        onClose={() => setReport(false)}
        onBlock={profile.relationship.state === 'blocking' ? undefined : () => block.mutate('block')}
      />
    </View>
  );
}
