import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { socialKeys } from '@/hooks/social/keys';
import { useUser } from '@/hooks/useUser';
import type { FeedPage } from '@/services/FeedService';
import PostService from '@/services/PostService';
import { removePostFromPages } from '@/utils/post.core';

/**
 * The author deletes their own post: after a confirm, the server deletes it
 * (with its likes, comments and media), and it leaves every feed already
 * loaded, the post screen's cache and the author's profile grid.
 *
 * `confirmAndDelete(id, onDone)` asks first; onDone runs after the delete
 * (the post screen uses it to go back).
 */
export function useDeletePost() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useUser();

  const mutation = useMutation({
    mutationFn: (id: string) => PostService.deletePost(id),
    onSuccess: (_, id) => {
      queryClient.setQueriesData<{ pages: FeedPage[] }>({ queryKey: ['feed'] }, (old) => removePostFromPages(old, id));
      // Only where no screen is showing it: the post screen leaves first
      // (onDone), then its cache goes, so it never refetches a deleted post.
      queryClient.removeQueries({ queryKey: ['post', id], type: 'inactive' });
      void queryClient.invalidateQueries({ queryKey: socialKeys.saved() });
      if (user?.id) void queryClient.invalidateQueries({ queryKey: socialKeys.profile(user.id) });
    },
  });

  const confirmAndDelete = (id: string, onDone?: () => void) => {
    Alert.alert(t('postShare.deleteConfirmTitle'), t('postShare.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('postShare.deletePost'),
        style: 'destructive',
        onPress: () =>
          mutation.mutate(id, {
            onSuccess: () => {
              onDone?.();
              queryClient.removeQueries({ queryKey: ['post', id] });
            },
            onError: (e) => Alert.alert(t('common.error'), e instanceof Error ? e.message : t('social.errors.generic')),
          }),
      },
    ]);
  };

  return { confirmAndDelete, isDeleting: mutation.isPending };
}
