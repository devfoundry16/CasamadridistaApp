import { isAxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useUser } from '@/hooks/useUser';
import type { FeedPage, Post } from '@/services/FeedService';
import PostService from '@/services/PostService';
import { mineOf, pollState, toggleChoice, type PollTally } from '@/utils/poll.core';
import { patchPost, patchPostInPages } from '@/utils/post.core';

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
    mutationFn: (optionIds: string[]) => PostService.votePoll(postId, optionIds),
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
  const multiple = tally?.multiple ?? post.poll?.multiple ?? false;
  const mine = mineOf(tally);
  const state = pollState({ open, total: tally?.total ?? null }, { signedIn: !!user?.id });

  // One answer: the tap replaces it. Several: the tap adds or removes it.
  const choose = (optionId: string) => {
    if (state.askSignIn) {
      requireAuth({ href: `/community/post/${post.id}`, mode: 'login' });
      return;
    }
    const next = toggleChoice(mine, optionId, multiple);
    if (!state.canVote || vote.isPending || !next) return;
    vote.mutate(next, {
      onError: (e) => {
        if (isAxiosError(e) && e.response?.status === 409) Alert.alert(t('community.poll.closed'));
        else Alert.alert(t('community.poll.failed'));
      },
    });
  };

  return { tally, state, open, choose, multiple, mine };
}

/**
 * The author ends their poll now, after a confirm: the poll closes, its tally
 * shows the results, and the post's cached copies carry the new closing time,
 * so the menu stops offering it.
 */
export function useEndPoll() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useUser();

  const mutation = useMutation({
    mutationFn: (post: Post) => PostService.closePoll(post.id),
    onSuccess: (tally, post) => {
      queryClient.setQueryData(pollKey(post.id, user?.id), tally);
      const patch: Partial<Post> = post.poll ? { poll: { ...post.poll, closes_at: tally.closes_at } } : {};
      queryClient.setQueryData<Post>(['post', post.id], (old) => patchPost(old, post.id, patch));
      queryClient.setQueriesData<{ pages: FeedPage[] }>({ queryKey: ['feed'] }, (old) => patchPostInPages(old, post.id, patch));
    },
  });

  const confirmAndEnd = (post: Post) => {
    Alert.alert(t('community.poll.endConfirmTitle'), t('community.poll.endConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('community.poll.end'),
        style: 'destructive',
        onPress: () => mutation.mutate(post, { onError: () => Alert.alert(t('community.poll.endFailed')) }),
      },
    ]);
  };

  return { confirmAndEnd, isEnding: mutation.isPending };
}
