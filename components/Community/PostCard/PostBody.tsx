import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Post } from '@/services/FeedService';
import TagPills from '../TagPills';
import Colors from '@/constants/colors';

const MAX_LINES = 3;

interface Props {
  post: Post;
  truncate?: boolean;
}

export default function PostBody({ post, truncate = true }: Props) {
  if (!post.title && !post.body && !post.country_code && !post.tagged_fan_club) return null;

  return (
    <View style={styles.container}>
      {post.title ? (
        <Text style={styles.title} numberOfLines={truncate ? 2 : undefined}>
          {post.title}
        </Text>
      ) : null}
      {post.body ? (
        <Text
          numberOfLines={truncate ? MAX_LINES : undefined}
          style={styles.body}
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

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    lineHeight: 22,
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text.secondary,
  },
});
