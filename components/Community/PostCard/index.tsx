import React, { memo, useCallback } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Post } from '@/services/FeedService';
import PostHeader  from './PostHeader';
import PostBody    from './PostBody';
import PostMedia   from './PostMedia';
import PostActions from './PostActions';
import Colors from '@/constants/colors';

interface Props {
  post: Post;
  /** Whether the post's video should be paused (controlled by feed visibility) */
  paused?: boolean;
}

function PostCard({ post, paused = true }: Props) {
  const router = useRouter();

  const goToAuthor = useCallback(() => {
    // Navigate to profile or fan-club page when available
  }, []);

  const goToComments = useCallback(() => {
    router.push(`/community/comments/${post.id}`);
  }, [post.id]);

  const goToReport = useCallback(() => {
    router.push(`/community/report/${post.id}`);
  }, [post.id]);

  const goToPost = useCallback(() => {
    router.push(`/community/post/${post.id}`);
  }, [post.id]);

  return (
    <View
      className="rounded-xl mb-3 overflow-hidden"
      style={{ backgroundColor: Colors.background.card }}
    >
      <PostHeader post={post} onAuthorPress={goToAuthor} />
      <PostBody   post={post} />
      {post.media?.length > 0 && (
        <PostMedia media={post.media} paused={paused} />
      )}
      <PostActions
        post={post}
        onCommentPress={goToComments}
        onReportPress={goToReport}
      />
    </View>
  );
}

export default memo(PostCard);
