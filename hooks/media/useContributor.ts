import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import ContributorMediaService from '@/services/ContributorMediaService';
import { useUser } from '@/hooks/useUser';
import { contributorKeys } from './keys';

/**
 * The contributor's own profile, permissions, allowed matches/categories,
 * today's match and upload limits — one request that gates the whole area.
 *
 * A 403 here is a *real answer* ("Not a Casa Media contributor", "Your
 * contributor access is suspended"), so it must not be retried: retrying turns
 * an instant explanation into three seconds of spinner. `error.message` is the
 * server's own sentence and is shown verbatim by `ContributorGate`.
 */
export function useContributorMe() {
  const { user } = useUser();

  return useQuery({
    queryKey: contributorKeys.me(),
    queryFn: () => ContributorMediaService.getMe(),
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/**
 * The caller's own contributor invitation.
 *
 * Asked only once `/contributor/me` has refused: an active contributor never
 * needs it, and an invited account is refused there exactly like a stranger.
 */
export function useContributorInvite(enabled: boolean) {
  return useQuery({
    queryKey: contributorKeys.invite(),
    queryFn: () => ContributorMediaService.getInvite(),
    enabled,
    staleTime: 60_000,
    retry: false,
  });
}

/**
 * Accept or decline the invitation.
 *
 * Accepting makes the account a contributor, so everything under the
 * contributor key is stale at once — `me` above all, which is what lets the
 * gate open without leaving the screen.
 */
export function useRespondToInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (response: 'accept' | 'decline') =>
      response === 'accept'
        ? ContributorMediaService.acceptInvite()
        : ContributorMediaService.declineInvite(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contributorKeys.all }),
  });
}

/** The match picker's list, for a contributor who is not scoped to a fixture. */
export function useContributorMatches(enabled = true) {
  return useQuery({
    queryKey: contributorKeys.matches(),
    queryFn: () => ContributorMediaService.listMatches({ limit: 50 }),
    enabled,
    staleTime: 10 * 60_000,
  });
}

/** Lifetime totals for the contributor home header. */
export function useContributorStats(enabled = true) {
  return useQuery({
    queryKey: contributorKeys.stats(),
    queryFn: () => ContributorMediaService.getStats(),
    enabled,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useItemStats(itemId: string | undefined) {
  return useQuery({
    queryKey: contributorKeys.stats(itemId),
    queryFn: () => ContributorMediaService.getItemStats(itemId as string),
    enabled: !!itemId,
    staleTime: 60_000,
  });
}
