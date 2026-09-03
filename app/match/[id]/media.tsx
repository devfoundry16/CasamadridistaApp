import { useGlobalSearchParams } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import MatchMediaScreen from '@/components/Media/Match/MatchMediaScreen';
import EmptyState from '@/components/Team/EmptyState';
import Colors from '@/constants/colors';

/** Casa Media coverage for this fixture. */
export default function MatchMediaTab() {
  const { t } = useTranslation();
  // Global, for the same reason as the Details tab: entering the match page at
  // `/match/123` (every card outside the archive) addresses the `index` child,
  // so this sibling would mount with no `id` and show the empty state for a
  // match that does have coverage.
  const { id } = useGlobalSearchParams<{ id: string }>();
  const matchId = Number.parseInt(id ?? '', 10);

  if (!Number.isFinite(matchId)) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>
        <EmptyState title={t('casaMedia.matchEmptyTitle')} />
      </View>
    );
  }

  return <MatchMediaScreen matchId={matchId} />;
}
