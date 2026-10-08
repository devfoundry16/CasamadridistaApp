import { useGlobalSearchParams, useRouter } from 'expo-router';
import { Shirt } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, Crest, TabScroll, Updated } from '@/components/Match/Center/parts';
import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { useMatchLineups, useWithSummary } from '@/hooks/football/matchCenter';
import type { Absence, LineupPlayer, TeamLineup, TeamRef } from '@/types/soccer/matchCenter';

/**
 * Lineups: the official XI, bench, coach and formation once announced, and
 * the players each club is missing. There is no predicted XI: the provider
 * does not supply one, and the app does not make one up.
 */
export default function MatchLineupsTab() {
  const { id } = useGlobalSearchParams();
  const matchId = Number.parseInt(String(id ?? ''), 10);
  const { t } = useTranslation();
  const { query, summary } = useWithSummary(useMatchLineups(matchId), matchId);

  return (
    <TabScroll query={query} isEmpty={() => false} empty={{ icon: Shirt, title: t('match.center.noData') }}>
      {(data) => (
        <>
          {data.lineups.length ? (
            data.lineups.map((team) => <LineupCard key={team.team.id ?? team.team.name} lineup={team} />)
          ) : (
            <Card>
              <View style={{ alignItems: 'center', paddingVertical: 12, gap: 8 }}>
                <Shirt size={24} color={Colors.text.muted} />
                <Text className="text-[13px] text-center" style={{ color: Colors.text.secondary }}>
                  {data.state === 'upcoming' ? t('match.center.lineupsPending') : t('match.center.lineupsUnavailable')}
                </Text>
              </View>
            </Card>
          )}

          {summary && (data.injuries.home.length || data.injuries.away.length) ? (
            <Card title={t('match.center.injuriesTitle')}>
              <AbsenceList team={summary.match.home} list={data.injuries.home} />
              <AbsenceList team={summary.match.away} list={data.injuries.away} />
            </Card>
          ) : null}

          <Updated at={data.fetched_at} />
        </>
      )}
    </TabScroll>
  );
}

function LineupCard({ lineup }: { lineup: TeamLineup }) {
  const { t } = useTranslation();
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Crest uri={lineup.team.logo} size={26} />
        <Text className="text-[15px] font-bold" style={{ flex: 1, color: Colors.text.primary }} numberOfLines={1}>
          {lineup.team.name}
        </Text>
        {lineup.formation ? (
          <Text className="text-[13px] font-semibold" style={{ color: Colors.darkGold }} accessibilityLabel={`${t('match.center.formation')} ${lineup.formation}`}>
            {lineup.formation}
          </Text>
        ) : null}
      </View>

      <SubHeading label={t('match.center.startingXI')} />
      {lineup.startXI.map((p, i) => (
        <PlayerLine key={p.id ?? `xi-${i}`} player={p} teamId={lineup.team.id} />
      ))}

      {lineup.substitutes.length ? <SubHeading label={t('match.center.substitutes')} /> : null}
      {lineup.substitutes.map((p, i) => (
        <PlayerLine key={p.id ?? `sub-${i}`} player={p} teamId={lineup.team.id} />
      ))}

      {lineup.coach?.name ? (
        <>
          <SubHeading label={t('match.center.coach')} />
          <Text className="text-[14px]" style={{ color: Colors.text.primary, paddingVertical: 6 }}>
            {lineup.coach.name}
          </Text>
        </>
      ) : null}
    </Card>
  );
}

function SubHeading({ label }: { label: string }) {
  return (
    <Text className="text-[12px] font-bold" style={{ color: Colors.text.tertiary, marginTop: 10, marginBottom: 2 }}>
      {label}
    </Text>
  );
}

function PlayerLine({ player, teamId }: { player: LineupPlayer; teamId: number | null }) {
  const router = useRouter();
  const canOpen = player.id != null && teamId != null;
  return (
    <Touchable
      disabled={!canOpen}
      onPress={() => router.push(`/player/${teamId}/${player.id}` as never)}
      accessibilityRole={canOpen ? 'button' : undefined}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 40,
        gap: 12,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text className="text-[13px] font-bold" style={{ width: 26, color: Colors.darkGold, fontVariant: ['tabular-nums'] }}>
        {player.number ?? ''}
      </Text>
      <Text className="text-[14px]" style={{ flex: 1, color: Colors.text.primary }} numberOfLines={1}>
        {player.name}
      </Text>
      {player.pos ? (
        <Text className="text-[12px]" style={{ color: Colors.text.tertiary }}>
          {player.pos}
        </Text>
      ) : null}
    </Touchable>
  );
}

function AbsenceList({ team, list }: { team: TeamRef; list: Absence[] }) {
  if (!list.length) return null;
  return (
    <View style={{ paddingVertical: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Crest uri={team.logo} size={18} />
        <Text className="text-[13px] font-semibold" style={{ color: Colors.text.secondary }}>
          {team.name}
        </Text>
      </View>
      {list.map((a, i) => (
        <View key={`${a.id ?? i}-${a.reason}`} style={{ flexDirection: 'row', paddingVertical: 5, gap: 12 }}>
          <Text className="text-[14px]" style={{ flex: 1, color: Colors.text.primary }} numberOfLines={1}>
            {a.name}
          </Text>
          {/* The reason is the provider's English text; it is shown as sent. */}
          <Text className="text-[12px]" style={{ color: Colors.text.tertiary, flexShrink: 1 }} numberOfLines={1}>
            {a.reason ?? a.type ?? ''}
          </Text>
        </View>
      ))}
    </View>
  );
}
