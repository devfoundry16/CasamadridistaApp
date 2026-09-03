import { MessageCircle } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import EmptyState from '@/components/Team/EmptyState';
import Colors from '@/constants/colors';

/**
 * Match-scoped community feed.
 *
 * Placeholder for now — the feed is not yet filterable by fixture. The tab
 * exists so the match page's information architecture is settled and the deep
 * link `?tab=community` has somewhere to land.
 */
export default function MatchCommunityTab() {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>
      <EmptyState
        icon={MessageCircle}
        title={t('match.communityEmptyTitle')}
        body={t('match.communityEmptyBody')}
      />
    </View>
  );
}
