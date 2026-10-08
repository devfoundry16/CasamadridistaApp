import { useGlobalSearchParams } from 'expo-router';
import { BarChart3 } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, Crest, StatBar, TabScroll, Updated } from '@/components/Match/Center/parts';
import { Text } from '@/components/Text';
import { formatSeasonLong } from '@/components/Team/Standings/competitions';
import Colors from '@/constants/colors';
import { useMatchStats, useMatchSummary } from '@/hooks/football/matchCenter';
import { matchStatKey } from '@/utils/matchCenter.core';

/**
 * Statistics: the in-match numbers once the match has started, and both
 * clubs' season numbers in this competition. Rows the API left empty on both
 * sides never arrive, and statistics without a label here are not shown.
 */
export default function MatchStatsTab() {
  const { id } = useGlobalSearchParams();
  const matchId = Number.parseInt(String(id ?? ''), 10);
  const { t } = useTranslation();
  const stats = useMatchStats(matchId);
  const { data: summary } = useMatchSummary(matchId);

  return (
    <TabScroll
      query={stats}
      isEmpty={(d) => !d.match.length && !d.season.rows.length}
      empty={{ icon: BarChart3, title: t('match.center.statsEmpty') }}
    >
      {(d) => {
        const matchRows = d.match
          .map((r) => ({ ...r, key: matchStatKey(r.type) }))
          .filter((r): r is typeof r & { key: string } => r.key !== null);
        return (
          <>
            {summary ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                <Crest uri={summary.match.home.logo} size={24} />
                <Crest uri={summary.match.away.logo} size={24} />
              </View>
            ) : null}

            {matchRows.length ? (
              <Card title={summary?.match.state === 'live' ? t('match.center.liveStatsTitle') : t('match.center.matchStatsTitle')}>
                {matchRows.map((r) => (
                  <StatBar key={r.type} label={t(r.key)} home={r.home} away={r.away} />
                ))}
              </Card>
            ) : null}

            {d.season.rows.length ? (
              <Card title={t('match.center.seasonStatsTitle')}>
                {d.season.league.name && d.season.season ? (
                  <Text className="text-[12px]" style={{ color: Colors.text.tertiary, marginTop: 4, marginBottom: 4 }}>
                    {t('match.center.seasonSubtitle', {
                      league: d.season.league.name,
                      season: formatSeasonLong(d.season.season),
                    })}
                  </Text>
                ) : null}
                {d.season.rows.map((r) => (
                  <StatBar key={r.key} label={t(`match.center.season.${r.key}`)} home={r.home} away={r.away} />
                ))}
              </Card>
            ) : null}

            <Updated at={d.fetched_at} />
          </>
        );
      }}
    </TabScroll>
  );
}
