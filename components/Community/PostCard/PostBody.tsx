import React from 'react';
import { View, Text } from 'react-native';
import type { Post } from '@/services/FeedService';
import TagPills from '../TagPills';
import Colors from '@/constants/colors';

const MAX_LINES = 5;

interface Props {
  post: Post;
  truncate?: boolean;
}

export default function PostBody({ post, truncate = true }: Props) {
  if (!post.body && !post.country_code && !post.tagged_fan_club) return null;

  return (
    <View className="px-4 py-1">
      {post.body ? (
        <Text
          numberOfLines={truncate ? MAX_LINES : undefined}
          style={{ color: Colors.text.primary, lineHeight: 20 }}
        >
          {post.body}
        </Text>
      ) : null}
      <TagPills
        countryCode={post.country_code}
        fanClubName={post.tagged_fan_club?.name}
      />
    </View>
  );
}
