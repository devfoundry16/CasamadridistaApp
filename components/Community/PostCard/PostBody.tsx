import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { Post } from '@/services/FeedService';
import TagPills from '../TagPills';
import Colors from '@/constants/colors';

const MAX_LINES = 5;

interface Props {
  post: Post;
}

export default function PostBody({ post }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!post.body && !post.country_code && !post.tagged_fan_club) return null;

  return (
    <View className="px-4 py-1">
      {post.body ? (
        <>
          <Text
            numberOfLines={expanded ? undefined : MAX_LINES}
            style={{ color: Colors.text.primary, lineHeight: 20 }}
          >
            {post.body}
          </Text>
          {post.body.split('\n').length > MAX_LINES && (
            <TouchableOpacity onPress={() => setExpanded((e) => !e)}>
              <Text style={{ color: Colors.darkGold, marginTop: 2, fontSize: 13 }}>
                {expanded ? 'Show less' : 'Show more'}
              </Text>
            </TouchableOpacity>
          )}
        </>
      ) : null}
      <TagPills
        countryCode={post.country_code}
        fanClubName={post.tagged_fan_club?.name}
      />
    </View>
  );
}
