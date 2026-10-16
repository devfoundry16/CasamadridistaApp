import { useQuery, type QueryClient } from '@tanstack/react-query';

import type { FeedPage, Post } from '@/services/FeedService';
import PostService from '@/services/PostService';
import { patchPost, patchPostInPages } from '@/utils/post.core';
import { socialKeys } from './keys';

/** Your saved collections, newest first (private to you). */
export function useSavedCollections(enabled = true) {
  return useQuery({
    queryKey: socialKeys.savedCollections(),
    queryFn: () => PostService.savedCollections(),
    enabled,
    staleTime: 30_000,
  });
}

/**
 * After a post's saved state changed (saved, unsaved, or put in a collection):
 * every cached copy of the post shows it, and the Saved tab and the
 * collections (counts, covers) are read again.
 */
export function afterSaveChange(queryClient: QueryClient, postId: string, saved: boolean, saveCount?: number) {
  const patch: Partial<Post> = { saved_by_me: saved, ...(typeof saveCount === 'number' ? { save_count: saveCount } : {}) };
  queryClient.setQueryData<Post>(['post', postId], (old) => patchPost(old, postId, patch));
  queryClient.setQueriesData<{ pages: FeedPage[] }>({ queryKey: ['feed'] }, (old) => patchPostInPages(old, postId, patch));
  queryClient.invalidateQueries({ queryKey: socialKeys.saved() });
  queryClient.invalidateQueries({ queryKey: socialKeys.savedCollections() });
}
