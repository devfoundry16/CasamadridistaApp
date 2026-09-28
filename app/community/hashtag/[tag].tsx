import { Stack, useLocalSearchParams } from 'expo-router';
import { Hash } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import FeedList from '@/components/Community/FeedList';
import EmptyState from '@/components/Team/EmptyState';
import Colors from '@/constants/colors';
import FeedService from '@/services/FeedService';
import { normaliseHashtag } from '@/utils/richText.core';

/**
 * Every approved post carrying `#tag`, newest first, as an infinite Community
 * feed with the tag as the header. Reached by tapping a hashtag anywhere
 * `RichText` renders one.
 *
 * The route keeps the tag as it was written, for the header; the request and
 * the cache key are lower-cased, so every spelling shares one feed.
 */
export default function HashtagScreen() {
  const { t } = useTranslation();
  const { tag: raw } = useLocalSearchParams<{ tag: string }>();
  const tag = normaliseHashtag(raw);

  const source = useMemo(
    () =>
      tag
        ? {
            key: ['feed', 'hashtag', tag.toLowerCase()] as const,
            fetchPage: (cursor: string | null) => FeedService.getHashtagFeed(tag, cursor),
          }
        : null,
    [tag],
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.medium }}>
      <Stack.Screen options={{ title: tag ? `#${tag}` : t('community.hashtag.title') }} />
      {source ? (
        <FeedList
          source={source}
          emptyText={t('community.hashtag.empty', { tag: `#${tag}` })}
          errorText={t('community.hashtag.failed')}
        />
      ) : (
        <EmptyState icon={Hash} title={t('community.hashtag.invalidTitle')} body={t('community.hashtag.invalidBody')} />
      )}
    </View>
  );
}
