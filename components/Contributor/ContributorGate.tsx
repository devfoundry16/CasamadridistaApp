import { router } from 'expo-router';
import { Clapperboard, Lock, ShieldAlert } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, View } from 'react-native';

import EmptyState from '@/components/Team/EmptyState';
import ErrorState from '@/components/Team/ErrorState';
import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import {
  useContributorInvite,
  useContributorMe,
  useRespondToInvite,
} from '@/hooks/media/useContributor';
import type { ApiError } from '@/services/ContributorMediaService';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useUser } from '@/hooks/useUser';
import Colors from '@/constants/colors';
import type { ContributorMe } from '@/types/media/contributor';
import { gateState } from '@/utils/contributorGate.core';
import { isStaffSessionRefusal } from '@/utils/staffRefusal.core';

interface Props {
  /** Where the login modal should return to. */
  returnTo: string;
  children: (me: ContributorMe) => React.ReactNode;
}

/**
 * The contributor area's front door.
 *
 * What it shows is decided by `gateState` (utils/contributorGate.core.ts), and
 * the outcomes are genuinely different things:
 *
 *   - signed out            → the auth modal, with a returnTo so the user lands
 *                             back on the screen they wanted.
 *   - loading               → spinner.
 *   - invited               → the invitation, with Accept and Decline. An
 *                             invited account is refused by the contributor API
 *                             exactly like a stranger, so this is asked for
 *                             separately once that refusal arrives.
 *   - 403 (not / suspended) → the server's own sentence, no retry button. This
 *                             is an *answer*, not a failure, and offering
 *                             "try again" would invite a pointless loop.
 *   - 401 session ended     → a manager's staff session closed (idle, lifetime
 *                             or revoked). Refreshing the token keeps the same
 *                             session, so the only way on is to sign out; the
 *                             signed-out case then offers sign-in with returnTo.
 *   - anything else         → retryable error.
 *
 * The 403/other split relies on `useContributorMe` running with `retry: false`
 * and surfacing `error.response.data.error` as the message.
 */
export default function ContributorGate({ returnTo, children }: Props) {
  const { t } = useTranslation();
  const { user, logout } = useUser();
  const requireAuth = useRequireAuth();
  const { data, isLoading, isError, error, refetch } = useContributorMe();

  const failure = isError ? (error as ApiError | null) : null;
  const status = failure?.status;
  const refusedByServer = status !== undefined && status >= 403 && status < 500;
  const invite = useContributorInvite(!!user?.id && refusedByServer);
  const respond = useRespondToInvite();

  const state = gateState({
    signedIn: !!user?.id,
    loading: isLoading,
    me: data ?? null,
    error: failure ? { status, message: failure.message } : null,
    staffSessionClosed: isStaffSessionRefusal(status, failure?.message),
    // A failed invitation check is "no open invitation": the refusal the
    // server already gave is then the truest thing to show.
    invite: invite.isError ? null : invite.data,
  });

  const page = (content: React.ReactNode) => (
    <View className="flex-1" style={{ backgroundColor: Colors.background.dark }}>
      {content}
    </View>
  );

  switch (state.kind) {
    case 'signedOut':
      return page(
        <EmptyState
          icon={Lock}
          title={t('contributor.gate.signInTitle')}
          body={t('contributor.gate.signInBody')}
          action={{
            label: t('contributor.gate.signIn'),
            onPress: () => {
              requireAuth({ href: returnTo, mode: 'login' });
            },
          }}
        />,
      );

    case 'loading':
      return (
        <View
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: Colors.background.dark }}
        >
          <ActivityIndicator color={Colors.darkGold} />
        </View>
      );

    case 'invited': {
      const answer = (response: 'accept' | 'decline') =>
        respond.mutate(response, {
          // Declined: there is nothing left on this screen for them.
          onSuccess: () => {
            if (response === 'decline') router.back();
          },
          onError: (err) =>
            Alert.alert(t('common.error'), (err as Error).message || t('contributor.invite.failed')),
        });

      return page(
        <View className="flex-1 items-center justify-center px-8 py-12">
          <Clapperboard size={32} color={Colors.darkGold} />
          <Text
            className="text-[17px] font-bold text-center mt-4"
            style={{ color: Colors.text.primary }}
          >
            {t('contributor.invite.title')}
          </Text>
          <Text
            className="text-[13px] leading-5 text-center mt-2"
            style={{ color: Colors.text.tertiary }}
          >
            {t('contributor.invite.body')}
          </Text>

          <Touchable
            onPress={() => answer('accept')}
            disabled={respond.isPending}
            accessibilityRole="button"
            className="mt-6 py-3 px-8 rounded-xl self-stretch items-center"
            style={({ pressed }) => ({
              backgroundColor: Colors.darkGold,
              opacity: pressed || respond.isPending ? 0.7 : 1,
            })}
          >
            {respond.isPending ? (
              <ActivityIndicator color={Colors.textWhite} />
            ) : (
              <Text className="text-[14px] font-semibold text-white">
                {t('contributor.invite.accept')}
              </Text>
            )}
          </Touchable>

          <Touchable
            onPress={() =>
              Alert.alert(t('contributor.invite.declineTitle'), t('contributor.invite.declineBody'), [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('contributor.invite.decline'),
                  style: 'destructive',
                  onPress: () => answer('decline'),
                },
              ])
            }
            disabled={respond.isPending}
            accessibilityRole="button"
            className="mt-3 py-2.5 px-8"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text className="text-[13px] font-semibold" style={{ color: Colors.text.tertiary }}>
              {t('contributor.invite.decline')}
            </Text>
          </Touchable>
        </View>,
      );
    }

    case 'refused':
      return page(
        <EmptyState
          icon={ShieldAlert}
          title={t('contributor.gate.notContributorTitle')}
          body={state.message}
        />,
      );

    case 'sessionEnded':
      return page(
        <EmptyState
          icon={ShieldAlert}
          title={t('contributor.gate.sessionEndedTitle')}
          body={t('contributor.gate.sessionEndedBody')}
          action={{
            label: t('contributor.gate.signOut'),
            // Signed out, the gate shows sign-in with returnTo; MediaAuthSync
            // drops this account's cached refusal.
            onPress: () => logout(),
          }}
        />,
      );

    case 'failed':
      return page(
        <ErrorState
          title={state.message || t('contributor.gate.loadFailed')}
          onRetry={() => refetch()}
        />,
      );

    // A signed-in user with a row that is not `active` reaches here only if the
    // server let them; belt and braces for a manager-shaped payload.
    case 'notContributor':
      return page(
        <EmptyState
          icon={ShieldAlert}
          title={t('contributor.gate.notContributorTitle')}
          body={t('contributor.gate.notContributorBody')}
          action={{ label: t('common.back'), onPress: () => router.back() }}
        />,
      );

    case 'ready':
      return <>{children(data as ContributorMe)}</>;
  }
}
