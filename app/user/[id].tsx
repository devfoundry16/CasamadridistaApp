import { useInfiniteQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { AtSign, Ban, CircleFadingPlus, Film, Flag, ImageIcon, MoreHorizontal, Send, UserX, Video } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, RefreshControl, View, useWindowDimensions } from 'react-native';

import EmptyState from '@/components/Team/EmptyState';
import Touchable from '@/components/Touchable';
import ActionSheet, { type SheetAction } from '@/components/Social/ActionSheet';
import FriendPicker from '@/components/Social/FriendPicker';
import ProfileGridCell from '@/components/Social/ProfileGridCell';
import ProfileHeader from '@/components/Social/ProfileHeader';
import ProfileStoryStrip from '@/components/Social/stories/ProfileStoryStrip';
import ProfileTabs from '@/components/Social/ProfileTabs';
import SocialReportSheet from '@/components/Social/SocialReportSheet';
import T from '@/components/Social/T';
import Colors from '@/constants/colors';
import { socialKeys } from '@/hooks/social/keys';
import { useProfile, useRelationshipAction } from '@/hooks/social/useProfile';
import { useUserStories } from '@/hooks/social/useStories';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useUser } from '@/hooks/useUser';
import CasaMediaService from '@/services/CasaMediaService';
import PostService from '@/services/PostService';
import SocialService, { SocialApiError } from '@/services/SocialService';
import type { ProfileGridItem, ProfileGridPage } from '@/types/social';
import {
  GRID_COLUMNS,
  GRID_GAP,
  gridCellSize,
  mediaGridCell,
  type ProfileTab,
} from '@/utils/profileGrid.core';
import { isUuid } from '@/utils/pushPayload.core';
import { ringState } from '@/utils/stories.core';
import { CREATE_CHOICES, createHref, type CreateChoice } from '@/utils/createChooser.core';

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
  const [createMenu, setCreateMenu] = useState(false);
  const [report, setReport] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [tab, setTab] = useState<ProfileTab>('posts');
  const { width } = useWindowDimensions();
  const cell = gridCellSize(width);

  const handle = raw?.startsWith('@') ? raw : null;
  const id = raw && isUuid(raw) ? raw : undefined;

  // The handle that could not be resolved (no such account, or the request
  // failed). Kept as the handle rather than a flag, so a new one starts over.
  const [failedHandle, setFailedHandle] = useState<string | null>(null);
  const unresolved = !!handle && failedHandle === handle;

  useEffect(() => {
    if (!handle) return;
    let alive = true;
    SocialService.resolveHandle(handle)
      .then((resolved) => {
        if (!alive) return;
        if (resolved) router.replace(`/user/${resolved}`);
        else setFailedHandle(handle);
      })
      .catch(() => {
        if (alive) setFailedHandle(handle);
      });
    return () => {
      alive = false;
    };
  }, [handle, router]);

  useEffect(() => {
    if (!user?.id) requireAuth({ href: `/user/${raw ?? ''}`, mode: 'login' });
  }, [user?.id, raw, requireAuth]);

  const { data: profile, isLoading, refetch, isRefetching } = useProfile(id);
  const block = useRelationshipAction(id ?? '');

  const isSelf = profile?.relationship.state === 'self';
  const blocking = profile?.relationship.state === 'blocking';
  // A blocked or blocking pair never sees each other's stories, so the ring
  // is not asked for at all then.
  const stories = useUserStories(profile && !blocking ? id : undefined);
  const ring = stories.data ? ringState(stories.data.stories) : null;
  const isContributor = profile?.user.is_media_contributor === true;
  // Saved is private and Media is a contributor's; a stale tab carried over
  // from another profile falls back to Posts.
  const shownTab: ProfileTab =
    (tab === 'saved' && !isSelf) || (tab === 'media' && !isContributor) ? 'posts' : tab;

  // One infinite query per tab: each keeps its own pages and cursor, so
  // switching back to a tab is instant.
  const grid = useInfiniteQuery({
    queryKey: shownTab === 'saved' ? socialKeys.saved() : socialKeys.profileGrid(id ?? '', shownTab),
    queryFn: async ({ pageParam }): Promise<ProfileGridPage | null> => {
      if (shownTab === 'saved') return PostService.savedGrid(pageParam);
      if (shownTab === 'media') {
        // What this contributor published in Casa Media, drawn in the same grid.
        const page = await CasaMediaService.list({ contributor_id: id!, cursor: pageParam });
        return { items: page.items.map(mediaGridCell), nextCursor: page.nextCursor };
      }
      return SocialService.userGrid(id!, shownTab, pageParam);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last?.nextCursor ?? undefined,
    enabled: !!id && !!profile && !blocking,
  });
  const cells = grid.data?.pages.flatMap((p) => p?.items ?? []) ?? [];

  const openPost = useCallback(
    (item: ProfileGridItem) =>
      router.push(shownTab === 'media' ? `/media/item/${item.id}` : `/community/post/${item.id}`),
    [router, shownTab],
  );

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

  const name = profile?.user.name ?? '';

  const header = (
    <Stack.Screen
      options={{
        title: profile?.user.username ? `@${profile.user.username}` : t('social.profile.title'),
        headerRight:
          profile
            ? () => (
                <Touchable onPress={() => setMenu(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('social.profile.more')} style={{ padding: 6 }}>
                  <MoreHorizontal size={22} color={Colors.text.primary} />
                </Touchable>
              )
            : undefined,
      }}
    />
  );

  // An unresolved handle falls through to "not available" below.
  if ((isLoading && id) || (handle && !unresolved)) {
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

  const emptyText =
    shownTab === 'saved'
      ? t('social.profile.empty.saved')
      : isSelf
        ? t(`social.profile.empty.${shownTab}Self`)
        : t(`social.profile.empty.${shownTab}`, { name });

  // Create (spec §3): Photo, Video, Reel or Story.
  const createIcons: Record<CreateChoice, React.ReactNode> = {
    photo: <ImageIcon size={20} color={Colors.darkGold} />,
    video: <Video size={20} color={Colors.darkGold} />,
    reel: <Film size={20} color={Colors.darkGold} />,
    story: <CircleFadingPlus size={20} color={Colors.darkGold} />,
  };
  const createActions: SheetAction[] = CREATE_CHOICES.map((choice) => ({
    key: choice,
    label: t(`social.profile.create_${choice}`),
    icon: createIcons[choice],
    onPress: () => router.push(createHref(choice) as any),
  }));

  const menuActions: SheetAction[] = [
    { key: 'share', label: t('social.profile.share'), icon: <Send size={20} color={Colors.darkGold} />, onPress: () => setSharing(true) },
    ...(isSelf
      ? []
      : [
          { key: 'report', label: t('social.profile.report'), icon: <Flag size={20} color={Colors.status.error} />, destructive: true, onPress: () => setReport(true) },
          ...(blocking
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
        ]),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.medium }}>
      {header}
      <FlatList
        data={blocking ? [] : cells}
        keyExtractor={(item) => item.id}
        numColumns={GRID_COLUMNS}
        renderItem={({ item }) => <ProfileGridCell item={item} size={cell} onPress={openPost} />}
        columnWrapperStyle={{ gap: GRID_GAP }}
        onEndReached={() => grid.hasNextPage && !grid.isFetchingNextPage && grid.fetchNextPage()}
        onEndReachedThreshold={0.6}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { void refetch(); void grid.refetch(); }} tintColor={Colors.darkGold} colors={[Colors.darkGold]} />}
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
            <ProfileHeader
              profile={profile}
              onMessage={openChat}
              onCreate={isSelf ? () => setCreateMenu(true) : undefined}
              storyRing={ring}
              onAvatarPress={ring ? () => router.push(`/stories/${id}`) : isSelf ? () => router.push('/stories/create') : undefined}
            />
            {!blocking && id && stories.data?.stories.length ? <ProfileStoryStrip authorId={id} stories={stories.data.stories} /> : null}
            {blocking ? (
              <T step="footnote" color={Colors.text.tertiary} align="center" style={{ padding: 24 }}>
                {t('social.profile.youBlocked', { name })}
              </T>
            ) : (
              <ProfileTabs active={shownTab} onSelect={setTab} isSelf={isSelf} isContributor={isContributor} />
            )}
          </>
        }
        ListEmptyComponent={
          blocking ? null : grid.isLoading ? (
            <ActivityIndicator color={Colors.darkGold} style={{ marginTop: 32 }} />
          ) : grid.isError ? (
            <T step="footnote" color={Colors.text.tertiary} align="center" style={{ padding: 32 }}>
              {t('social.errors.generic')}
            </T>
          ) : (
            <T step="footnote" color={Colors.text.tertiary} align="center" style={{ padding: 32 }}>
              {emptyText}
            </T>
          )
        }
        ListFooterComponent={grid.isFetchingNextPage ? <ActivityIndicator color={Colors.darkGold} style={{ margin: 16 }} /> : null}
        contentContainerStyle={{ gap: GRID_GAP, paddingBottom: 32 }}
      />

      <ActionSheet visible={menu} onClose={() => setMenu(false)} cancelLabel={t('common.cancel')} actions={menuActions} />
      <ActionSheet visible={createMenu} title={t('social.profile.create')} onClose={() => setCreateMenu(false)} cancelLabel={t('common.cancel')} actions={createActions} />
      {id ? (
        <FriendPicker
          visible={sharing}
          onClose={() => setSharing(false)}
          kind="profile"
          id={id}
          subject={profile.user.username ? `@${profile.user.username}` : name}
        />
      ) : null}
      <SocialReportSheet
        visible={report}
        target={id ? { kind: 'profile', id } : null}
        onClose={() => setReport(false)}
        onBlock={blocking ? undefined : () => block.mutate('block')}
      />
    </View>
  );
}
