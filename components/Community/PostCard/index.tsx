import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { Post } from '@/services/FeedService';
import PostHeader  from './PostHeader';
import PostBody    from './PostBody';
import PostMedia   from './PostMedia';
import PostActions from './PostActions';
import Colors from '@/constants/colors';

interface Props {
  post: Post;
  paused?: boolean;
}

function PostCard({ post, paused = true }: Props) {
  const router = useRouter();

  const goToPost = useCallback(() => {
    router.push(`/community/post/${post.id}`);
  }, [post.id, router]);

  const goToReport = useCallback(() => {
    router.push(`/community/report/${post.id}`);
  }, [post.id, router]);

  return (
    <Pressable onPress={goToPost} style={styles.container}>
      <PostHeader post={post} onAuthorPress={goToPost} onReportPress={goToReport} />
      <PostBody   post={post} truncate />
      {post.media?.length > 0 && (
        <PostMedia media={post.media} paused={paused} />
      )}
      <PostActions post={post} onCommentPress={goToPost} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.default,
  },
});

export default memo(PostCard);
