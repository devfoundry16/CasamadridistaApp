import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Heart } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import type { Comment } from '@/services/CommentService';
import CommentService from '@/services/CommentService';
import Colors from '@/constants/colors';

interface Props {
  comment: Comment;
  onReply?: (comment: Comment) => void;
}

const PLACEHOLDER = require('@/assets/images/placeholder_avatar.png');

export default function CommentRow({ comment, onReply }: Props) {
  const [liked, setLiked]         = useState(false);
  const [likeCount, setLikeCount] = useState(comment.like_count);

  const handleLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    try {
      if (wasLiked) await CommentService.unlikeComment(comment.id);
      else          await CommentService.likeComment(comment.id);
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
    }
  };

  const authorName = [comment.author?.first_name, comment.author?.last_name]
    .filter(Boolean)
    .join(' ') || 'Madridista';

  return (
    <View className="flex-row px-4 py-3 border-b" style={{ borderColor: Colors.border.default }}>
      <Image
        source={comment.author?.avatar_url ? { uri: comment.author.avatar_url } : PLACEHOLDER}
        style={{ width: 32, height: 32, borderRadius: 16 }}
        contentFit="cover"
      />
      <View className="flex-1 ml-2">
        <View className="flex-row items-center justify-between">
          <Text className="font-semibold text-sm" style={{ color: Colors.text.primary }}>{authorName}</Text>
          <Text className="text-xs" style={{ color: Colors.text.muted }}>
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </Text>
        </View>
        <Text className="text-sm mt-0.5" style={{ color: Colors.text.primary }}>{comment.body}</Text>
        <View className="flex-row items-center mt-1 gap-3">
          <TouchableOpacity onPress={() => onReply?.(comment)} activeOpacity={0.7}>
            <Text className="text-xs" style={{ color: Colors.text.tertiary }}>Reply</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLike} className="flex-row items-center" activeOpacity={0.7}>
            <Heart
              size={13}
              color={liked ? Colors.status.error : Colors.text.tertiary}
              fill={liked ? Colors.status.error : 'none'}
            />
            {likeCount > 0 && (
              <Text className="text-xs ml-0.5" style={{ color: Colors.text.tertiary }}>{likeCount}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
