import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { formatDistanceToNow } from 'date-fns';
import type { Post } from '@/services/FeedService';
import VerifiedBadge from '../VerifiedBadge';
import FanClubBadge from '../FanClubBadge';
import Colors from '@/constants/colors';

interface Props {
  post: Post;
  onAuthorPress?: () => void;
}

function authorDisplayName(post: Post): string {
  if (post.author_type === 'fan_club' && post.fan_club?.name) {
    return post.fan_club.name;
  }
  const a = post.author;
  if (!a) return 'Unknown';
  return [a.first_name, a.last_name].filter(Boolean).join(' ') || 'Madridista';
}

function authorAvatarUrl(post: Post): string | null {
  if (post.author_type === 'fan_club' && post.fan_club?.logo_url) {
    return post.fan_club.logo_url;
  }
  return post.author?.avatar_url ?? null;
}

const PLACEHOLDER = require('@/assets/images/placeholder_avatar.png');

export default function PostHeader({ post, onAuthorPress }: Props) {
  const displayName = authorDisplayName(post);
  const avatarUrl   = authorAvatarUrl(post);
  const isFanClub   = post.author_type === 'fan_club';
  const isVerified  = isFanClub
    ? post.fan_club?.is_verified
    : post.author?.role === 'moderator' || post.author?.role === 'admin';

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <TouchableOpacity
      onPress={onAuthorPress}
      activeOpacity={0.8}
      className="flex-row items-center px-4 pt-3 pb-1"
    >
      <Image
        source={avatarUrl ? { uri: avatarUrl } : PLACEHOLDER}
        style={{ width: 40, height: 40, borderRadius: 20 }}
        contentFit="cover"
        placeholder={undefined}
        transition={200}
      />
      <View className="ml-2 flex-1">
        <View className="flex-row items-center flex-wrap">
          <Text className="font-semibold text-sm" style={{ color: Colors.text.primary }}>
            {displayName}
          </Text>
          {isVerified && <VerifiedBadge size={13} />}
          {isFanClub && <FanClubBadge small />}
        </View>
        <Text className="text-xs" style={{ color: Colors.text.tertiary }}>
          {timeAgo}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
