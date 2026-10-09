import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { Post } from '@/services/FeedService';
import { usePostMenu } from './usePostMenu';
import { normaliseItem } from '@/services/media/normalise';
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

  // A person's name opens their profile (§20). A fan club post has no personal
  // profile behind it, so it keeps opening the post.
  const goToAuthor = useCallback(() => {
    if (post.author_type === 'user' && post.author_id) router.push(`/user/${post.author_id}`);
    else goToPost();
  }, [post.author_type, post.author_id, router, goToPost]);

  // The feed embeds the raw media_items row (`short_description`, flat cover
  // columns), not the teaser the Casa Media endpoints serialize. Normalised
  // here, once per post, so the card reads the same `MediaItem` everything
  // else does.
  const teaser = useMemo(
    () => (post.kind === 'media_teaser' && post.media_item ? normaliseItem(post.media_item) : null),
    [post.kind, post.media_item],
  );
  // An official Casa teaser already carries the item's short description as
  // its post body, shown just above the card; a fan's share has no body.
  const showPreview = !!teaser?.description && teaser.description.trim() !== (post.body ?? '').trim();

  const menu = usePostMenu(post);

  return (
    <>
    <Touchable
      onPress={goToPost}
      // The card is one accessible element, which hides the "..." button
      // inside it from VoiceOver/TalkBack: the menu comes back as an action.
      accessibilityActions={menu.openMenu ? [{ name: 'menu', label: menu.actionLabel }] : undefined}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'menu') menu.openMenu?.();
      }}
      style={({ pressed }) => [styles.container, { opacity: pressed ? 0.85 : 1 }]}
    >
      <PostHeader post={post} onAuthorPress={goToAuthor} onReportPress={menu.openMenu} />
      <PostBody post={post} truncate />
      {teaser ? (
        <MediaTeaserCard item={teaser} preview={showPreview} />
      ) : (
        post.media?.length > 0 && <PostMediaPreview media={post.media} />
      )}
      <PostActions post={post} onCommentPress={goToPost} />
    </Touchable>
    {/* Siblings of the card, not children: a touch inside a Modal still
        bubbles through the React tree and must not open the post. */}
    {menu.sheets}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.default,
  },
});

export default memo(PostCard);
