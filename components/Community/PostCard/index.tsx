import React, { memo, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { Post } from '@/services/FeedService';
import PostHeader from './PostHeader';
import PostBody from './PostBody';
import PostMediaPreview from './PostMediaPreview';
import PostActions from './PostActions';
import MediaTeaserCard from './MediaTeaserCard';
import Colors from '@/constants/colors';
import Touchable from '@/components/Touchable';

interface Props {
  post: Post;
}

function PostCard({ post }: Props) {
  const router = useRouter();

  const goToPost = useCallback(() => {
    router.push(`/community/post/${post.id}`);
  }, [post.id, router]);

  return (
    <Touchable onPress={goToPost} style={({ pressed }) => [styles.container, { opacity: pressed ? 0.85 : 1 }]}>
      <PostHeader post={post} onAuthorPress={goToPost} />
      <PostBody post={post} truncate />
      {post.kind === 'media_teaser' && post.media_item ? (
        <MediaTeaserCard item={post.media_item} />
      ) : (
        post.media?.length > 0 && <PostMediaPreview media={post.media} />
      )}
      <PostActions post={post} onCommentPress={goToPost} />
    </Touchable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.default,
  },
});

export default memo(PostCard);
