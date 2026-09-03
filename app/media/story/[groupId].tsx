import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import StoryViewer from '@/components/Media/Stories/StoryViewer';
import { Text } from '@/components/Text';
import Colors from '@/constants/colors';
import { useStories } from '@/hooks/media/useStories';
import { ALL_STORIES_GROUP, allStoriesGroup } from '@/services/media/normalise';

/**
 * Story viewer route. Presented as a `fullScreenModal` (declared in
 * `app/_layout.tsx`) so the tab bar is fully covered.
 *
 * The whole story set is loaded rather than just the tapped group — paging past
 * the end of one group into the next is the core interaction, and fetching the
 * next group at that moment would stall it.
 */
export default function StoryRoute() {
  const { t } = useTranslation();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { data: matchGroups, isLoading } = useStories();

  // `groupId` is a fixture id, or the sentinel `all`. `all` collapses every
  // active story into one group so the viewer pages through the whole set
  // rather than a single fixture (contract addendum, "Stories").
  const groups = React.useMemo(() => {
    if (!matchGroups) return undefined;
    if (groupId !== ALL_STORIES_GROUP) return matchGroups;
    const everything = allStoriesGroup(matchGroups.flatMap((group) => group.items));
    return everything ? [everything] : [];
  }, [matchGroups, groupId]);

  if (isLoading || !groups) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.darkGold} size="large" />
      </View>
    );
  }

  if (!groups.length) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: Colors.text.tertiary }}>{t('casaMedia.storyUnavailable')}</Text>
      </View>
    );
  }

  return <StoryViewer groups={groups} initialGroupId={groupId} />;
}

const styles = StyleSheet.create({
  centered: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
});
