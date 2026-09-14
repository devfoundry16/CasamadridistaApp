import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useUser } from '@/hooks/useUser';
import SocialService from '@/services/SocialService';
import type { FriendAction, RelationshipState, SocialProfile } from '@/types/social';
import { optimisticState } from '@/utils/chat.core';
import { socialKeys } from './keys';

/** A profile by user id. `null` data means not found — or blocked; the same answer. */
export function useProfile(userId: string | undefined) {
  const { user } = useUser();
  return useQuery({
    queryKey: socialKeys.profile(userId ?? ''),
    queryFn: () => SocialService.getProfile(userId!),
    enabled: !!userId && !!user?.id,
    staleTime: 30_000,
  });
}

export function useMyProfile() {
  const { user } = useUser();
  return useQuery({
    queryKey: socialKeys.me(),
    queryFn: () => SocialService.getMe(),
    enabled: !!user?.id,
    staleTime: 60_000,
  });
}

/**
 * Friend, cancel, accept, decline, remove, block, unblock — optimistic.
 *
 * The control changes shape the moment it is tapped (design plan: an action
 * that waits for a round trip reads as broken), then settles on the state the
 * server reports, which may differ: two people requesting each other at once
 * both end up "request_received", say.
 */
export function useRelationshipAction(userId: string) {
  const queryClient = useQueryClient();
  const key = socialKeys.profile(userId);

  return useMutation({
    mutationFn: (action: FriendAction) => SocialService.act(userId, action),
    onMutate: async (action) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<SocialProfile | null>(key);
      if (previous) {
        const state = optimisticState(previous.relationship.state, action);
        queryClient.setQueryData<SocialProfile>(key, withState(previous, state));
      }
      return { previous };
    },
    onError: (_error, _action, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(key, context.previous);
    },
    onSuccess: (state) => {
      const current = queryClient.getQueryData<SocialProfile | null>(key);
      if (current) queryClient.setQueryData<SocialProfile>(key, withState(current, state));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      for (const k of [socialKeys.friends(), socialKeys.requests(), socialKeys.suggestions(), socialKeys.blocked(), socialKeys.inbox('inbox'), socialKeys.inbox('requests'), socialKeys.unread()]) {
        void queryClient.invalidateQueries({ queryKey: k });
      }
      void queryClient.invalidateQueries({ queryKey: [...socialKeys.all, 'search'] });
    },
  });
}

function withState(profile: SocialProfile, state: RelationshipState): SocialProfile {
  const friendsDelta =
    profile.relationship.state !== 'friends' && state === 'friends' ? 1 : profile.relationship.state === 'friends' && state !== 'friends' ? -1 : 0;
  return {
    ...profile,
    relationship: {
      state,
      // A block closes messaging at once; anything else keeps what the server
      // last said until the refetch in onSettled replaces it.
      can_message: state === 'blocking' || state === 'self' ? false : profile.relationship.can_message,
    },
    stats: { ...profile.stats, friends: Math.max(0, profile.stats.friends + friendsDelta) },
  };
}
