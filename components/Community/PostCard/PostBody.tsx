import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { Post } from '@/services/FeedService';
import RichText from '@/components/Social/RichText';
import TagPills from '../TagPills';
import TaggedLine from './TaggedLine';
import Colors from '@/constants/colors';

const MAX_LINES = 3;

interface Props {
  post: Post;
  truncate?: boolean;
}

/**
 * Title, body, who was tagged, and the country / fan club pills.
 *
 * The title and body are `RichText`: links, @mentions and #hashtags are
 * tappable, and a tap on one of them does not also open the card.
 */
export default function PostBody({ post, truncate = true }: Props) {
  const hasTagged = !!post.tagged?.length;
  if (!post.title && !post.body && !post.country_code && !post.tagged_fan_club && !hasTagged) return null;

  return (
    <View style={styles.container}>
      {post.title ? (
        <RichText
          text={post.title}
          step="headline"
          weight="bold"
          color={Colors.text.primary}
          linkColor={Colors.darkGold}
          numberOfLines={truncate ? 2 : undefined}
          style={styles.title}
        />
      ) : null}
      {post.body ? (
        <RichText
          text={post.body}
          step="body"
          color={Colors.text.secondary}
          linkColor={Colors.darkGold}
          numberOfLines={truncate ? MAX_LINES : undefined}
          style={styles.body}
        />
      ) : null}
      <TaggedLine tagged={post.tagged} all={!truncate} />
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
  // Sizes as before; line height comes from the type step, which is taller
  // under Arabic so Cairo's diacritics do not clip.
  title: {
    fontSize: 16,
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
  },
});
