import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { socialKeys } from '@/hooks/social/keys';
import { useUser } from '@/hooks/useUser';
import type { FeedPage, Post } from '@/services/FeedService';
import PostService from '@/services/PostService';
import { patchPost, patchPostInPages } from '@/utils/post.core';
import { pinErrorKey } from '@/utils/postInsights.core';

/**
 * Pin your own post to the top of your profile, or take the pin off. On
 * success the post's cached copies say so, and your profile grid reloads with
 * the pins first. A refusal (three pins already, a post not yet approved) is
 * explained in an alert.
 */
export function usePinPost() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useUser();

  const mutation = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) => PostService.setPinned(id, pinned),
    onSuccess: (result, { id, pinned }) => {
      const patch: Partial<Post> = { profile_pinned_at: pinned ? result.profile_pinned_at ?? new Date().toISOString() : null };
      queryClient.setQueryData<Post>(['post', id], (old) => patchPost(old, id, patch));
      queryClient.setQueriesData<{ pages: FeedPage[] }>({ queryKey: ['feed'] }, (old) => patchPostInPages(old, id, patch));
      if (user?.id) void queryClient.invalidateQueries({ queryKey: socialKeys.profile(user.id) });
    },
    onError: (e) => Alert.alert(t('common.error'), t(pinErrorKey(e instanceof Error ? e.message : null))),
  });

  return {
    setPinned: (id: string, pinned: boolean) => mutation.mutate({ id, pinned }),
    isPinning: mutation.isPending,
  };
}
