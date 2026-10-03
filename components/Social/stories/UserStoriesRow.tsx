import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import Avatar from '@/components/Social/Avatar';
import T from '@/components/Social/T';
import Colors from '@/constants/colors';
import { useStoryFeed } from '@/hooks/social/useStories';

/**
 * The people's stories row in Community (C1): "Your story" first (add one, or
 * watch yours), then friends', then everyone's. A gold ring means something
 * unseen. Casa Madridista's official stories keep their own row.
 */
export default function UserStoriesRow({ viewerId, viewerName, viewerAvatar }: { viewerId: string | null; viewerName?: string | null; viewerAvatar?: string | null }) {
  const { t } = useTranslation();
  const router = useRouter();
  const feed = useStoryFeed();
  if (!viewerId) return null;
  const groups = feed.data ?? [];
  const mine = groups.find((g) => g.author_id === viewerId);
  const others = groups.filter((g) => g.author_id !== viewerId);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 14, paddingVertical: 8 }}>
      <Pressable
        onPress={() => router.push((mine ? `/stories/${viewerId}?from=row` : '/stories/create') as any)}
        onLongPress={() => router.push('/stories/create' as any)}
        accessibilityRole="button"
        accessibilityLabel={mine ? t('stories.yourStory') : t('stories.add')}
        style={{ alignItems: 'center', width: 68 }}
      >
        <View style={{ padding: 2, borderRadius: 40, borderWidth: 2, borderColor: mine && !mine.all_seen ? Colors.darkGold : 'transparent' }}>
          <Avatar uri={viewerAvatar} name={viewerName} size={56} />
          {!mine ? (
            <View style={{ position: 'absolute', end: 0, bottom: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.darkGold, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.background.dark }}>
              <Plus size={14} color="#1A1A1A" />
            </View>
          ) : null}
        </View>
        <T numberOfLines={1} style={{ fontSize: 11, marginTop: 4 }}>{mine ? t('stories.yourStory') : t('stories.add')}</T>
      </Pressable>
      {others.map((g) => (
        <Pressable
          key={g.author_id}
          onPress={() => router.push(`/stories/${g.author_id}?from=row` as any)}
          accessibilityRole="button"
          accessibilityLabel={t('stories.openOf', { name: g.author?.name ?? '' })}
          style={{ alignItems: 'center', width: 68 }}
        >
          <View style={{ padding: 2, borderRadius: 40, borderWidth: 2, borderColor: g.all_seen ? Colors.border.default : Colors.darkGold }}>
            <Avatar uri={g.author?.avatar_url} name={g.author?.name} size={56} />
          </View>
          <T numberOfLines={1} style={{ fontSize: 11, marginTop: 4 }}>{g.author?.name ?? ''}</T>
        </Pressable>
      ))}
    </ScrollView>
  );
}
