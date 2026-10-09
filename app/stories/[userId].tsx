import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';

import UserStoryViewer from '@/components/Social/stories/UserStoryViewer';
import T from '@/components/Social/T';
import Colors from '@/constants/colors';
import { useStoryFeed, useUserStories } from '@/hooks/social/useStories';
import { useUser } from '@/hooks/useUser';
import { storyIndex } from '@/utils/stories.core';
import { useTranslation } from 'react-i18next';

/**
 * A person's stories (C1). From the Community row (`?from=row`) the viewer
 * walks on through everyone in the row; from a profile, a push or a reply
 * card it shows that one person's stories; a profile's strip passes `?at=` the
 * story tapped.
 */
export default function StoriesScreen() {
  const { userId, from, at } = useLocalSearchParams<{ userId: string; from?: string; at?: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useUser();
  const fromRow = from === 'row';
  const feed = useStoryFeed();
  const single = useUserStories(fromRow ? undefined : userId);

  const groups = useMemo(() => {
    if (fromRow) return (feed.data ?? []).filter((g) => g.stories.length);
    return single.data && single.data.stories.length ? [single.data] : [];
  }, [fromRow, feed.data, single.data]);
  const start = Math.max(0, groups.findIndex((g) => g.author_id === userId));
  const loading = fromRow ? feed.isLoading : single.isLoading;
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.darkGold} />
      </View>
    );
  }
  if (!groups.length) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <T color={Colors.text.secondary} onPress={close}>{t('stories.none')}</T>
      </View>
    );
  }
  return (
    <UserStoryViewer
      groups={groups}
      viewerId={user?.id ?? null}
      initialGroup={start}
      initialStory={fromRow ? 0 : storyIndex(groups[start]?.stories ?? [], at)}
      onClose={close}
    />
  );
}
