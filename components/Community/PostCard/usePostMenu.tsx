import { useRouter } from 'expo-router';
import { Flag, Pencil, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ReportSheet from '@/components/Community/Moderation/ReportSheet';
import ActionSheet, { type SheetAction } from '@/components/Social/ActionSheet';
import Colors from '@/constants/colors';
import { useDeletePost } from '@/hooks/useDeletePost';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useUser } from '@/hooks/useUser';
import type { Post } from '@/services/FeedService';
import { feedMenuActions, isOwnPost } from '@/utils/post.core';

/**
 * A post's "..." menu, the same on a feed card and on the post screen:
 * Report on someone else's post (signing in on tap), Edit and Delete on your own.
 *
 * Returns the button's handler, the sheets to render as SIBLINGS of the card
 * (a touch inside a Modal still bubbles through the React tree), and whether
 * the report sheet is open (the post screen pauses its keyboard avoidance).
 */
export function usePostMenu(post: Post | undefined, { onDeleted }: { onDeleted?: () => void } = {}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useUser();
  const requireAuth = useRequireAuth();
  const { confirmAndDelete } = useDeletePost();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const isOwn = isOwnPost(post, user?.id);
  // While the post screen is still loading the post, there is nothing to offer.
  const actions: SheetAction[] = !post ? [] : feedMenuActions({ isOwn, kind: post.kind }).map((key) =>
    key === 'edit'
      ? {
          key,
          label: t('community.compose.editAction'),
          icon: <Pencil size={20} color={Colors.text.primary} />,
          onPress: () => router.push({ pathname: '/community/edit/[id]', params: { id: post.id } }),
        }
      : key === 'delete'
      ? {
          key,
          label: t('postShare.deletePost'),
          icon: <Trash2 size={20} color={Colors.status.error} />,
          destructive: true,
          onPress: () => confirmAndDelete(post.id, onDeleted),
        }
      : {
          key,
          label: t('community.reportPost'),
          icon: <Flag size={20} color={Colors.status.error} />,
          destructive: true,
          onPress: () => {
            if (requireAuth({ href: `/community/post/${post.id}`, mode: 'login' })) setReportOpen(true);
          },
        },
  );

  const sheets = (
    <>
      <ActionSheet visible={menuOpen} onClose={() => setMenuOpen(false)} cancelLabel={t('common.cancel')} actions={actions} />
      {reportOpen && post ? <ReportSheet visible postId={post.id} onClose={() => setReportOpen(false)} /> : null}
    </>
  );

  return {
    /** For PostHeader's "..." button; undefined hides it. */
    openMenu: actions.length ? () => setMenuOpen(true) : undefined,
    actionLabel: t('community.postMenu'),
    sheets,
    reportOpen,
  };
}
