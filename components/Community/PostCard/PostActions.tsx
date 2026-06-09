import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Share,
  Animated,
  StyleSheet,
} from "react-native";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react-native";
import type { Post } from "@/services/FeedService";
import PostService from "@/services/PostService";
import Colors from "@/constants/colors";

interface Props {
  post: Post;
  onCommentPress?: () => void;
}

export default function PostActions({ post, onCommentPress }: Props) {
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [bookmarked, setBookmarked] = useState(false);
  const hasInteracted = useRef(false);
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!hasInteracted.current) {
      setLiked(post.liked_by_me);
      setLikeCount(post.like_count);
    }
  }, [post.liked_by_me, post.like_count]);

  const handleLike = async () => {
    hasInteracted.current = true;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));

    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1.3,
        useNativeDriver: true,
        speed: 50,
      }),
      Animated.spring(heartScale, {
        toValue: 1.0,
        useNativeDriver: true,
        speed: 50,
      }),
    ]).start();

    try {
      if (wasLiked) await PostService.unlikePost(post.id);
      else await PostService.likePost(post.id);
    } catch (error) {
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
    } finally {
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: post.body ?? "Check out this post on Casamadridista!",
        url: `casamadridistaapp://community/post/${post.id}`,
      });
      await PostService.sharePost(post.id, "native_share");
    } catch {
      // dismissed
    }
  };

  const formatCount = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  const iconColor = Colors.text.tertiary;
  const likedColor = Colors.status.error;

  return (
    <View style={styles.container}>
      <View style={styles.leftGroup}>
        {/* Like */}
        <TouchableOpacity
          onPress={handleLike}
          style={styles.action}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Heart
              size={22}
              color={liked ? likedColor : iconColor}
              fill={liked ? likedColor : "none"}
            />
          </Animated.View>
          <Text
            style={[
              styles.count,
              { color: liked ? likedColor : Colors.text.tertiary },
            ]}
          >
            {formatCount(likeCount)}
          </Text>
        </TouchableOpacity>

        {/* Comment */}
        <TouchableOpacity
          onPress={onCommentPress}
          style={styles.action}
          activeOpacity={0.7}
        >
          <MessageCircle size={22} color={iconColor} />
          <Text style={styles.count}>{formatCount(post.comment_count)}</Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity
          onPress={handleShare}
          style={styles.action}
          activeOpacity={0.7}
        >
          <Share2 size={22} color={iconColor} />
          <Text style={styles.count}>{formatCount(post.share_count)}</Text>
        </TouchableOpacity>
      </View>

      {/* Bookmark */}
      <TouchableOpacity
        onPress={() => setBookmarked((b) => !b)}
        activeOpacity={0.7}
      >
        <Bookmark
          size={22}
          color={bookmarked ? Colors.darkGold : iconColor}
          fill={bookmarked ? Colors.darkGold : "none"}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  count: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.text.tertiary,
  },
});
