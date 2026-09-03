import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import CasaMediaService from '@/services/CasaMediaService';
import type { MediaItem } from '@/types/media/casaMedia';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { patchMediaItemEverywhere } from './cache';
import { mediaKeys } from './keys';

type Flag = 'liked_by_me' | 'saved_by_me';

/**
 * Like / save for one item, applied optimistically to *every* cached copy.
 *
 * The same item appears in the home rails, a collection list, a match page and
 * the item screen simultaneously. Patching only the item query would leave the
 * heart un-filled on the card the user tapped through from, so the mutation
 * sweeps the whole `casaMedia` key space (see hooks/media/cache.ts).
 */
export function useMediaEngagement(item: Pick<MediaItem, 'id'> | undefined) {
  const queryClient = useQueryClient();
  const requireAuth = useRequireAuth();
  const id = item?.id;

  const applyToggle = useCallback(
    (flag: Flag, counter: 'like_count' | null, next: boolean) => {
      if (!id) return;
      patchMediaItemEverywhere(queryClient, id, (cached) => {
        if (cached[flag] === next) return cached;
        const patched: MediaItem = { ...cached, [flag]: next };
        if (counter) {
          patched[counter] = Math.max(0, (cached[counter] ?? 0) + (next ? 1 : -1));
        }
        return patched;
      });
    },
    [id, queryClient],
  );

  const likeMutation = useMutation({
    mutationFn: (next: boolean) =>
      next ? CasaMediaService.like(id!) : CasaMediaService.unlike(id!),
    onMutate: (next: boolean) => {
      applyToggle('liked_by_me', 'like_count', next);
      return { previous: !next };
    },
    onError: (_error, _next, context) => {
      if (context) applyToggle('liked_by_me', 'like_count', context.previous);
    },
  });

  const saveMutation = useMutation({
    mutationFn: (next: boolean) =>
      next ? CasaMediaService.save(id!) : CasaMediaService.unsave(id!),
    onMutate: (next: boolean) => {
      applyToggle('saved_by_me', null, next);
      return { previous: !next };
    },
    onError: (_error, _next, context) => {
      if (context) applyToggle('saved_by_me', null, context.previous);
    },
    onSettled: () => {
      // The saved list is a server-ordered projection; re-fetch rather than
      // trying to splice the item into the right page.
      queryClient.invalidateQueries({ queryKey: mediaKeys.saved() });
    },
  });

  /**
   * Both actions are auth-gated. `requireAuth` persists the pending returnTo and
   * pushes the login modal, so a guest who taps "save" lands back here signed in.
   */
  const toggleLike = useCallback(
    (currentlyLiked: boolean) => {
      if (!id) return;
      if (!requireAuth({ href: `/media/item/${id}`, mediaId: id })) return;
      likeMutation.mutate(!currentlyLiked);
    },
    [id, likeMutation, requireAuth],
  );

  const toggleSave = useCallback(
    (currentlySaved: boolean) => {
      if (!id) return;
      if (!requireAuth({ href: `/media/item/${id}`, mediaId: id })) return;
      saveMutation.mutate(!currentlySaved);
    },
    [id, requireAuth, saveMutation],
  );

  return {
    toggleLike,
    toggleSave,
    isLiking: likeMutation.isPending,
    isSaving: saveMutation.isPending,
  };
}
