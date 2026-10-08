import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Play } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import Touchable from '@/components/Touchable';

import Colors from '@/constants/colors';
import type { UserStory } from '@/types/social';
import { stripTile } from '@/utils/stories.core';

/**
 * A profile's live stories as a strip between the actions and the tabs
 * (spec §25: "Actions … Then: STORIES. Then tabs"). A tap opens the viewer at
 * that story; an unseen one has a gold border. Nothing when there are none.
 */
const TILE_HEIGHT = 96;

/*
 * The strip's height is fixed: inside the profile list's header a horizontal
 * ScrollView otherwise stretches to fill the screen, hiding the tabs and grid.
 */
export default function ProfileStoryStrip({ authorId, stories }: { authorId: string; stories: UserStory[] }) {
  const { t } = useTranslation();
  const router = useRouter();
  if (!stories.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ height: TILE_HEIGHT + 20, flexGrow: 0 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 8, alignItems: 'flex-start' }}
      accessibilityLabel={t('stories.title')}
    >
      {stories.map((story, i) => {
        const tile = stripTile(story);
        return (
          <Touchable
            key={story.id}
            onPress={() => router.push(`/stories/${authorId}?at=${story.id}` as any)}
            accessibilityRole="button"
            accessibilityLabel={t('stories.openNumber', { number: i + 1 })}
            style={({ pressed }) => ({
              width: 64,
              height: TILE_HEIGHT,
              borderRadius: 10,
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: tile.unseen ? Colors.darkGold : Colors.border.default,
              backgroundColor: Colors.background.card,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            {tile.image ? <Image source={{ uri: tile.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : null}
            {tile.video ? (
              <View style={{ position: 'absolute', end: 4, top: 4 }}>
                <Play size={14} color="#fff" fill="#fff" />
              </View>
            ) : null}
          </Touchable>
        );
      })}
    </ScrollView>
  );
}
