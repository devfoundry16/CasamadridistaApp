import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import CasaMediaService from '@/services/CasaMediaService';
import type { MediaFollowKind, MediaFollows } from '@/types/media/casaMedia';
import { mediaKeys } from './keys';

const EMPTY: MediaFollows = { match: [], category: [] };

/**
 * Everything this account follows (§26).
 *
 * One query for the whole set rather than one per toggle: the backend caps a
 * user at 500 follows, the payload is a couple of string arrays, and a per-item
 * query would mean a request for every match card on screen.
 */
export function useFollows() {
  return useQuery({
    queryKey: mediaKeys.follows(),
    queryFn: () => CasaMediaService.getFollows(),
    staleTime: 5 * 60_000,
  });
}

/**
 * The follow state of one thing, and a toggle for it.
 *
 * Optimistic, and rolled back on failure. A follow toggle that waits for a
 * round trip before moving reads as broken, and this one is tapped from a match
 * header where the network is often a stadium's.
 */
export function useFollow(kind: MediaFollowKind, refId: string | number | null | undefined) {
  const queryClient = useQueryClient();
  const requireAuth = useRequireAuth();
  const { data } = useFollows();

  const ref = refId == null ? null : String(refId);
  const following = !!ref && (data?.[kind] ?? []).includes(ref);

  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      if (!ref) return;
      if (next) await CasaMediaService.follow(kind, ref);
      else await CasaMediaService.unfollow(kind, ref);
    },
    onMutate: async (next: boolean) => {
      await queryClient.cancelQueries({ queryKey: mediaKeys.follows() });
      const previous = queryClient.getQueryData<MediaFollows>(mediaKeys.follows());
      if (ref) {
        queryClient.setQueryData<MediaFollows>(mediaKeys.follows(), (current) => {
          const base = current ?? EMPTY;
          const list = base[kind] ?? [];
          return {
            ...base,
            [kind]: next ? [...new Set([...list, ref])] : list.filter((id) => id !== ref),
          };
        });
      }
      return { previous };
    },
    onError: (_error, _next, context) => {
      if (context?.previous) {
        queryClient.setQueryData(mediaKeys.follows(), context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: mediaKeys.follows() });
    },
  });

  const toggle = useCallback(() => {
    if (!ref) return;
    // A follow belongs to an account. Send an anonymous viewer through the auth
    // gate and back to where they were, the same way like and save do.
    if (!requireAuth({ href: `/media/match/${ref}` })) return;
    mutation.mutate(!following);
  }, [ref, requireAuth, mutation, following]);

  return { following, toggle, isPending: mutation.isPending, enabled: !!ref };
}
