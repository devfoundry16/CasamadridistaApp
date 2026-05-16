import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Share, Alert } from 'react-native';
import { Heart, MessageCircle, Share2, Flag } from 'lucide-react-native';
import type { Post } from '@/services/FeedService';
import PostService from '@/services/PostService';
import Colors from '@/constants/colors';

interface Props {
  post: Post;
  onCommentPress?: () => void;
  onReportPress?: () => void;
}

export default function PostActions({ post, onCommentPress, onReportPress }: Props) {
  const [liked, setLiked]         = useState(post.liked_by_me);
  const [likeCount, setLikeCount] = useState(post.like_count);

  const handleLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    try {
      if (wasLiked) await PostService.unlikePost(post.id);
      else          await PostService.likePost(post.id);
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: post.body ?? 'Check out this post on Casamadridista!',
        url: `https://casamadridista.com/feed/${post.id}`,
      });
      await PostService.sharePost(post.id, 'native_share');
    } catch {
      // User dismissed
    }
  };

  const formatCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

  const iconColor = Colors.text.tertiary;
  const likedColor = Colors.status.error;

  return (
    <View className="flex-row items-center px-4 py-2 border-t" style={{ borderColor: Colors.border.default }}>
      {/* Like */}
      <TouchableOpacity onPress={handleLike} className="flex-row items-center mr-5" activeOpacity={0.7}>
        <Heart size={20} color={liked ? likedColor : iconColor} fill={liked ? likedColor : 'none'} />
        <Text className="ml-1 text-sm" style={{ color: liked ? likedColor : Colors.text.tertiary }}>
          {formatCount(likeCount)}
        </Text>
      </TouchableOpacity>

      {/* Comment */}
      <TouchableOpacity onPress={onCommentPress} className="flex-row items-center mr-5" activeOpacity={0.7}>
        <MessageCircle size={20} color={iconColor} />
        <Text className="ml-1 text-sm" style={{ color: Colors.text.tertiary }}>
          {formatCount(post.comment_count)}
        </Text>
      </TouchableOpacity>

      {/* Share */}
      <TouchableOpacity onPress={handleShare} className="flex-row items-center mr-5" activeOpacity={0.7}>
        <Share2 size={20} color={iconColor} />
        <Text className="ml-1 text-sm" style={{ color: Colors.text.tertiary }}>
          {formatCount(post.share_count)}
        </Text>
      </TouchableOpacity>

      {/* Report */}
      <TouchableOpacity onPress={onReportPress} className="ml-auto" activeOpacity={0.7}>
        <Flag size={18} color={iconColor} />
      </TouchableOpacity>
    </View>
  );
}
