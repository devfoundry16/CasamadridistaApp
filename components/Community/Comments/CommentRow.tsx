import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Text';
import { Image } from 'expo-image';
import { Heart } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import type { Comment } from '@/services/CommentService';
import {
  likeComment,
  unlikeComment,
  type CommentTargetKind,
} from '@/services/MediaCommentsAdapter';
import Colors from '@/constants/colors';

interface Props {
  comment: Comment;
  onReply?: (comment: Comment) => void;
  /** Which comment table this row belongs to. Defaults to the community feed. */
  targetKind?: CommentTargetKind;
}

const PLACEHOLDER = require('@/assets/images/placeholder_avatar.png');

export default function CommentRow({ comment, onReply, targetKind = 'post' }: Props) {
  const { t } = useTranslation();
  const [liked, setLiked]         = useState(false);
  const [likeCount, setLikeCount] = useState(comment.like_count);

  const handleLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    try {
      if (wasLiked) await unlikeComment(targetKind, comment.id);
      else          await likeComment(targetKind, comment.id);
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
    }
  };

  const authorName = [comment.author?.first_name, comment.author?.last_name]
    .filter(Boolean)
    .join(' ') || t('community.madridista');

  return (
    <View className="flex-row px-4 py-3 border-b" style={{ borderColor: Colors.border.default }}>
      <Image
        source={comment.author?.avatar_url ? { uri: comment.author.avatar_url } : PLACEHOLDER}
        style={{ width: 32, height: 32, borderRadius: 16 }}
        contentFit="cover"
      />
      {/* marginStart, not ml-2: the avatar must stay on the leading edge in RTL. */}
      <View className="flex-1" style={{ marginStart: 8 }}>
        <View className="flex-row items-center justify-between">
          <Text className="font-semibold text-sm" style={{ color: Colors.text.primary }}>{authorName}</Text>
          <Text className="text-xs" style={{ color: Colors.text.muted }}>
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </Text>
        </View>
        <Text className="text-sm mt-0.5" style={{ color: Colors.text.primary }}>{comment.body}</Text>
        <View className="flex-row items-center mt-1 gap-3">
          <TouchableOpacity onPress={() => onReply?.(comment)} activeOpacity={0.7}>
            <Text className="text-xs" style={{ color: Colors.text.tertiary }}>{t('community.reply')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLike} className="flex-row items-center" activeOpacity={0.7}>
            <Heart
              size={13}
              color={liked ? Colors.status.error : Colors.text.tertiary}
              fill={liked ? Colors.status.error : 'none'}
            />
            {likeCount > 0 && (
              <Text className="text-xs" style={{ color: Colors.text.tertiary, marginStart: 2 }}>{likeCount}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
