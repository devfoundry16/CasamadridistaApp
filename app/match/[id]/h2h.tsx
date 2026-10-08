import { useGlobalSearchParams } from 'expo-router';
import { Swords } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import MatchLine from '@/components/Match/Center/MatchLine';
import { Card, Crest, TabScroll } from '@/components/Match/Center/parts';
import { Text } from '@/components/Text';
import Colors from '@/constants/colors';
import { useMatchH2H, useMatchSummary } from '@/hooks/football/matchCenter';

/** Head-to-head: the last ten meetings of the two clubs, with wins counted by club. */
export default function MatchH2HTab() {
  const { id } = useGlobalSearchParams();
  const matchId = Number.parseInt(String(id ?? ''), 10);
  const { t } = useTranslation();
  const h2h = useMatchH2H(matchId);
  const { data: summary } = useMatchSummary(matchId);

  return (
    <TabScroll
      query={h2h}
      isEmpty={(d) => !d.matches.length}
      empty={{ icon: Swords, title: t('match.center.h2hEmpty') }}
    >
      {(d) => (
        <>
          {summary ? (
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start' }}>
                <Tally value={d.homeWins} label={t('match.center.h2hWins', { team: summary.match.home.name })} logo={summary.match.home.logo} />
                <Tally value={d.draws} label={t('match.center.draws')} />
                <Tally value={d.awayWins} label={t('match.center.h2hWins', { team: summary.match.away.name })} logo={summary.match.away.logo} />
              </View>
            </Card>
          ) : null}
          <Card title={t('match.center.h2hTitle')}>
            {d.matches.map((m) => (
              <MatchLine
                key={m.id}
                fixtureId={m.id}
                date={m.date}
                league={m.league.name}
                home={m.home}
                away={m.away}
                goals={m.goals}
              />
            ))}
          </Card>
        </>
      )}
    </TabScroll>
  );
}

function Tally({ value, label, logo }: { value: number; label: string; logo?: string | null }) {
  return (
    <View style={{ alignItems: 'center', flex: 1, gap: 4 }}>
      {logo !== undefined ? <Crest uri={logo} size={28} /> : <View style={{ height: 28 }} />}
      <Text className="text-[22px] font-bold" style={{ color: Colors.text.primary, fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
      <Text className="text-[11px] text-center" style={{ color: Colors.text.tertiary }} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}
