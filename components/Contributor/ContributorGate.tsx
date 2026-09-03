import { router } from 'expo-router';
import { Lock, ShieldAlert } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import EmptyState from '@/components/Team/EmptyState';
import ErrorState from '@/components/Team/ErrorState';
import { useContributorMe } from '@/hooks/media/useContributor';
import type { ApiError } from '@/services/ContributorMediaService';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useUser } from '@/hooks/useUser';
import Colors from '@/constants/colors';
import type { ContributorMe } from '@/types/media/contributor';

interface Props {
  /** Where the login modal should return to. */
  returnTo: string;
  children: (me: ContributorMe) => React.ReactNode;
}

/**
 * The contributor area's front door.
 *
 * Four outcomes, and they are genuinely different things:
 *
 *   - signed out            → the auth modal, with a returnTo so the user lands
 *                             back on the screen they wanted.
 *   - loading               → spinner.
 *   - 403 (not / suspended) → the server's own sentence, no retry button. This
 *                             is an *answer*, not a failure, and offering
 *                             "try again" would invite a pointless loop.
 *   - anything else         → retryable error.
 *
 * The 403/other split relies on `useContributorMe` running with `retry: false`
 * and surfacing `error.response.data.error` as the message.
 */
export default function ContributorGate({ returnTo, children }: Props) {
  const { t } = useTranslation();
  const { user } = useUser();
  const requireAuth = useRequireAuth();
  const { data, isLoading, isError, error, refetch } = useContributorMe();

  if (!user?.id) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.background.dark }}>
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
        />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: Colors.background.dark }}
      >
        <ActivityIndicator color={Colors.darkGold} />
      </View>
    );
  }

  if (isError || !data) {
    const failure = error as ApiError | null;
    const message = failure?.message ?? '';
    // 401 is handled by the global axios interceptor (it refreshes or clears
    // the session), so anything 403-or-above-and-below-500 that reaches here is
    // the server saying no on purpose: show its sentence, and do not offer a
    // retry button that cannot change the answer.
    const status = failure?.status;
    const refused = status !== undefined && status >= 403 && status < 500;

    if (refused) {
      return (
        <View className="flex-1" style={{ backgroundColor: Colors.background.dark }}>
          <EmptyState
            icon={ShieldAlert}
            title={t('contributor.gate.notContributorTitle')}
            body={message}
          />
        </View>
      );
    }

    return (
      <View className="flex-1" style={{ backgroundColor: Colors.background.dark }}>
        <ErrorState title={message || t('contributor.gate.loadFailed')} onRetry={() => refetch()} />
      </View>
    );
  }

  // A signed-in user with a row that is not `active` reaches here only if the
  // server let them; belt and braces for a manager-shaped payload.
  if (!data.contributor && !data.isMediaManager) {
    return (
      <View className="flex-1" style={{ backgroundColor: Colors.background.dark }}>
        <EmptyState
          icon={ShieldAlert}
          title={t('contributor.gate.notContributorTitle')}
          body={t('contributor.gate.notContributorBody')}
          action={{ label: t('common.back'), onPress: () => router.back() }}
        />
      </View>
    );
  }

  return <>{children(data)}</>;
}
