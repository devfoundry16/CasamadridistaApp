import { isAxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useUser } from '@/hooks/useUser';
import type { Post } from '@/services/FeedService';
import PostService from '@/services/PostService';
import { pollState, type PollTally } from '@/utils/poll.core';

/**
 * Per viewer: a tally carries the viewer's own vote and, once they may see
 * them, the results. Keyed by account so a switch never shows the previous
 * account's vote or counts.
 */
export const pollKey = (postId: string, viewerId: string | null | undefined) =>
  ['poll', postId, viewerId ?? 'anon'] as const;

/** A poll's tally. Counts are null until the viewer may see results. */
export function usePostPoll(postId: string, enabled = true) {
  const { user } = useUser();
  return useQuery<PollTally>({
    queryKey: pollKey(postId, user?.id),
    queryFn: () => PostService.getPoll(postId),
    enabled: enabled && !!postId,
    staleTime: 30_000,
  });
}

function useVoteMutation(postId: string) {
  const queryClient = useQueryClient();
  const { user } = useUser();
  return useMutation({
    mutationFn: (optionId: string) => PostService.votePoll(postId, optionId),
    onSuccess: (tally) => queryClient.setQueryData(pollKey(postId, user?.id), tally),
    onError: () => queryClient.invalidateQueries({ queryKey: pollKey(postId, user?.id) }),
  });
}

/**
 * Everything a poll needs, shared by the card's buttons and the screen-reader
 * "Vote: …" actions so both behave the same: a signed-out viewer is asked to
 * sign in, a closed poll says so, a failure says so.
 */
export function usePollVote(post: Post, enabled = true) {
  const { t } = useTranslation();
  const { user } = useUser();
  const requireAuth = useRequireAuth();
  const { data: tally } = usePostPoll(post.id, enabled);
  const vote = useVoteMutation(post.id);

  const open = tally?.open ?? (post.poll ? Date.parse(post.poll.closes_at) > Date.now() : false);
  const state = pollState({ mine: tally?.mine ?? null, open, total: tally?.total ?? null }, { signedIn: !!user?.id });

  const choose = (optionId: string) => {
    if (state.askSignIn) {
      requireAuth({ href: `/community/post/${post.id}`, mode: 'login' });
      return;
    }
    if (!state.canVote || vote.isPending || tally?.mine === optionId) return;
    vote.mutate(optionId, {
      onError: (e) => {
        if (isAxiosError(e) && e.response?.status === 409) Alert.alert(t('community.poll.closed'));
        else Alert.alert(t('community.poll.failed'));
      },
    });
  };

  return { tally, state, open, choose };
}
