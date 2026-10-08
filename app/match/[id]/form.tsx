import { useGlobalSearchParams } from 'expo-router';
import { TrendingUp } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import MatchLine from '@/components/Match/Center/MatchLine';
import { Card, Crest, TabScroll } from '@/components/Match/Center/parts';
import { Text } from '@/components/Text';
import Colors from '@/constants/colors';
import { useMatchForm, useWithSummary } from '@/hooks/football/matchCenter';
import type { TeamForm, TeamRef } from '@/types/soccer/matchCenter';

/** Form: each club's last five finished matches in any competition. */
export default function MatchFormTab() {
  const { id } = useGlobalSearchParams();
  const matchId = Number.parseInt(String(id ?? ''), 10);
  const { t } = useTranslation();
  const { query, summary } = useWithSummary(useMatchForm(matchId), matchId);

  return (
    <TabScroll
      query={query}
      isEmpty={(d) => !summary || (!d.home.matches.length && !d.away.matches.length)}
      empty={{ icon: TrendingUp, title: t('match.center.formEmpty') }}
    >
      {(d) =>
        summary ? (
          <>
            <TeamFormCard team={summary.match.home} form={d.home} />
            <TeamFormCard team={summary.match.away} form={d.away} />
          </>
        ) : null
      }
    </TabScroll>
  );
}

function TeamFormCard({ team, form }: { team: TeamRef; form: TeamForm }) {
  const { t } = useTranslation();
  if (!form.matches.length) return null;
  const self = { id: team.id, name: team.name, logo: team.logo };
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <Crest uri={team.logo} size={26} />
        <View style={{ flex: 1 }}>
          <Text className="text-[15px] font-bold" style={{ color: Colors.text.primary }} numberOfLines={1}>
            {team.name}
          </Text>
          <Text className="text-[12px]" style={{ color: Colors.text.tertiary }}>
            {t('match.center.wdl', { w: form.wins, d: form.draws, l: form.losses })} ·{' '}
            {t('match.center.goalsForAgainst', { for: form.goalsFor, against: form.goalsAgainst })}
          </Text>
        </View>
      </View>
      {form.matches.map((m) => (
        <MatchLine
          key={m.id}
          fixtureId={m.id}
          date={m.date}
          league={m.league.name}
          home={m.home ? self : m.opponent}
          away={m.home ? m.opponent : self}
          goals={m.home ? { home: m.goalsFor, away: m.goalsAgainst } : { home: m.goalsAgainst, away: m.goalsFor }}
          result={m.result}
        />
      ))}
    </Card>
  );
}
