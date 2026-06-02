import React, { memo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
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

  const goToAuthor = useCallback(() => {}, []);

  const goToComments = useCallback(() => {
    router.push(`/community/comments/${post.id}`);
  }, [post.id]);

  const goToReport = useCallback(() => {
    router.push(`/community/report/${post.id}`);
  }, [post.id]);

  return (
    <View style={styles.container}>
      <PostHeader post={post} onAuthorPress={goToAuthor} onReportPress={goToReport} />
      <PostBody   post={post} />
      {post.media?.length > 0 && (
        <PostMedia media={post.media} paused={paused} />
      )}
      <PostActions post={post} onCommentPress={goToComments} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.default,
  },
});

export default memo(PostCard);
