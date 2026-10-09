import React, { memo, useCallback, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Flag } from 'lucide-react-native';
import type { Post } from '@/services/FeedService';
import ActionSheet, { type SheetAction } from '@/components/Social/ActionSheet';
import ReportSheet from '@/components/Community/Moderation/ReportSheet';
import { useUser } from '@/hooks/useUser';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { feedMenuActions } from '@/utils/post.core';
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
  const { t } = useTranslation();
  const { user } = useUser();
  const requireAuth = useRequireAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

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

  // The "..." menu: Report on someone else's post (signing in on tap). Your
  // own post has nothing to offer yet, so the button is hidden.
  const isOwn = !!user?.id && post.author_type === 'user' && post.author_id === user.id;
  const menu: SheetAction[] = feedMenuActions({ isOwn }).map((key) => ({
    key,
    label: t('community.reportPost'),
    icon: <Flag size={20} color={Colors.status.error} />,
    destructive: true,
    onPress: () => {
      if (requireAuth({ href: `/community/post/${post.id}`, mode: 'login' })) setReportOpen(true);
    },
  }));

  return (
    <>
    <Touchable
      onPress={goToPost}
      // The card is one accessible element, which hides the "..." button
      // inside it from VoiceOver/TalkBack: the menu comes back as an action.
      accessibilityActions={menu.length ? [{ name: 'menu', label: t('community.postMenu') }] : undefined}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'menu') setMenuOpen(true);
      }}
      style={({ pressed }) => [styles.container, { opacity: pressed ? 0.85 : 1 }]}
    >
      <PostHeader post={post} onAuthorPress={goToAuthor} onReportPress={menu.length ? () => setMenuOpen(true) : undefined} />
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
    {menu.length ? (
      <ActionSheet visible={menuOpen} onClose={() => setMenuOpen(false)} cancelLabel={t('common.cancel')} actions={menu} />
    ) : null}
    {reportOpen ? <ReportSheet visible postId={post.id} onClose={() => setReportOpen(false)} /> : null}
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
