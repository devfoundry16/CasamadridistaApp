import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { useUser } from '@/hooks/useUser';
import MatchCenterService from '@/services/Football/MatchCenterService';
import type { MatchState, PollPick, PredictionTally } from '@/types/soccer/matchCenter';
import { combinedState, summaryPollMs } from '@/utils/matchCenter.core';

/**
 * One query per tab, so each loads, fails and retries on its own.
 *
 * staleTime follows the match state like the server cache does: a minute
 * while live, longer before kickoff and after the final whistle.
 */
export const matchCenterKeys = {
  all: ['match-center'] as const,
  tab: (id: number, tab: string) => [...matchCenterKeys.all, id, tab] as const,
  predictions: (id: number, userId: string | null) =>
    [...matchCenterKeys.all, id, 'predictions', userId] as const,
};

const MIN = 60_000;
export const staleFor = (state: MatchState | undefined) =>
  state === 'live' ? MIN : state === 'finished' ? 60 * MIN : 10 * MIN;

const valid = (id: number) => Number.isFinite(id) && id > 0;

export function useMatchSummary(id: number) {
  return useQuery({
    queryKey: matchCenterKeys.tab(id, 'summary'),
    queryFn: () => MatchCenterService.summary(id),
    enabled: valid(id),
    staleTime: (q) => staleFor(q.state.data?.match.state),
    refetchInterval: (q) => summaryPollMs(q.state.data?.match),
  });
}

interface TabQuery<T> {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  isRefetching: boolean;
  refetch: () => unknown;
}

/**
 * A tab's own query merged with the summary it takes team names and crests
 * from: it loads, fails and retries as one.
 */
export function useWithSummary<T>(query: TabQuery<T>, id: number) {
  const summary = useMatchSummary(id);
  const state = combinedState(query, summary);
  return {
    summary: summary.data,
    query: {
      data: query.data,
      isPending: state.isPending,
      isError: state.isError,
      isRefetching: query.isRefetching || summary.isRefetching,
      refetch: () => Promise.all([query.refetch(), summary.refetch()]),
    },
  };
}

/** The summary's match state, read from the cache the header already filled. */
function useMatchState(id: number): MatchState | undefined {
  return useMatchSummary(id).data?.match.state;
}

export function useMatchForm(id: number) {
  return useQuery({
    queryKey: matchCenterKeys.tab(id, 'form'),
    queryFn: () => MatchCenterService.form(id),
    enabled: valid(id),
    staleTime: 60 * MIN,
  });
}

export function useMatchH2H(id: number) {
  return useQuery({
    queryKey: matchCenterKeys.tab(id, 'h2h'),
    queryFn: () => MatchCenterService.h2h(id),
    enabled: valid(id),
    staleTime: 6 * 60 * MIN,
  });
}

export function useMatchLineups(id: number) {
  const state = useMatchState(id);
  return useQuery({
    queryKey: matchCenterKeys.tab(id, 'lineups'),
    queryFn: () => MatchCenterService.lineups(id),
    enabled: valid(id),
    staleTime: staleFor(state),
  });
}

export function useMatchStats(id: number) {
  const state = useMatchState(id);
  return useQuery({
    queryKey: matchCenterKeys.tab(id, 'stats'),
    queryFn: () => MatchCenterService.stats(id),
    enabled: valid(id),
    staleTime: staleFor(state),
    refetchInterval: state === 'live' ? MIN : false,
  });
}

/** Keyed by account, so a sign-in or sign-out never shows someone else's pick. */
export function useMatchPredictions(id: number) {
  const { user } = useUser();
  const userId = user?.id ?? null;
  return useQuery({
    queryKey: matchCenterKeys.predictions(id, userId),
    queryFn: () => MatchCenterService.predictions(id),
    enabled: valid(id),
    staleTime: MIN,
  });
}

export function useVotePrediction(id: number) {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const userId = user?.id ?? null;
  return useMutation({
    mutationFn: (pick: PollPick) => MatchCenterService.vote(id, pick),
    onSuccess: (tally: PredictionTally) => {
      queryClient.setQueryData(matchCenterKeys.predictions(id, userId), tally);
    },
    onError: (error) => {
      // 409: the match kicked off since the poll was loaded. Reload it, and
      // the tab shows the poll as closed.
      if (isAxiosError(error) && error.response?.status === 409) {
        void queryClient.invalidateQueries({ queryKey: matchCenterKeys.predictions(id, userId) });
      }
    },
  });
}
