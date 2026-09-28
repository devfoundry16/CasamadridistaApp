import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react-native";
import type { FeedPage, Post } from "@/services/FeedService";
import PostService from "@/services/PostService";
import Colors from "@/constants/colors";
import PostShareSheet from "@/components/Social/PostShareSheet";
import { socialKeys } from "@/hooks/social/keys";
import { patchPost, patchPostInPages } from "@/utils/post.core";

interface Props {
  post: Post;
  onCommentPress?: () => void;
}

export default function PostActions({ post, onCommentPress }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [saved, setSaved] = useState(post.saved_by_me ?? false);
  const [shareOpen, setShareOpen] = useState(false);
  const hasInteracted = useRef(false);
  const hasSaved = useRef(false);
  const saving = useRef(false);
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!hasInteracted.current) {
      setLiked(post.liked_by_me);
      setLikeCount(post.like_count);
    }
  }, [post.liked_by_me, post.like_count]);

  // Same rule as the like: follow the server's value until the person taps.
  useEffect(() => {
    if (!hasSaved.current) setSaved(post.saved_by_me ?? false);
  }, [post.saved_by_me]);

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

  // Optimistic, rolled back on failure. One request at a time, so a double tap
  // cannot race a save against its own unsave.
  const handleSave = async () => {
    if (saving.current) return;
    saving.current = true;
    hasSaved.current = true;
    const wasSaved = saved;
    setSaved(!wasSaved);
    try {
      const result = wasSaved ? await PostService.unsavePost(post.id) : await PostService.savePost(post.id);
      const nowSaved = typeof result?.saved === "boolean" ? result.saved : !wasSaved;
      setSaved(nowSaved);
      // Every cached copy of the post (detail, photo viewer, each feed tab), so
      // a card remounted from the cache shows the new state rather than the old.
      const patch: Partial<Post> = {
        saved_by_me: nowSaved,
        ...(typeof result?.save_count === "number" ? { save_count: result.save_count } : {}),
      };
      queryClient.setQueryData<Post>(["post", post.id], (old) => patchPost(old, post.id, patch));
      queryClient.setQueriesData<{ pages: FeedPage[] }>({ queryKey: ["feed"] }, (old) =>
        patchPostInPages(old, post.id, patch),
      );
      queryClient.invalidateQueries({ queryKey: socialKeys.saved() });
    } catch {
      setSaved(wasSaved);
    } finally {
      saving.current = false;
    }
  };

  // §16: a sheet with "Send to a friend" and "Share elsewhere", instead of
  // going straight to the system share sheet.
  const handleShare = () => setShareOpen(true);

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
        onPress={handleSave}
        activeOpacity={0.7}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={saved ? t("community.unsavePost") : t("community.savePost")}
        accessibilityState={{ selected: saved }}
      >
        <Bookmark
          size={22}
          color={saved ? Colors.darkGold : iconColor}
          fill={saved ? Colors.darkGold : "none"}
        />
      </TouchableOpacity>
      <PostShareSheet visible={shareOpen} post={post} onClose={() => setShareOpen(false)} />
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
