import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import type { TeamRef } from '@/types/soccer/matchCenter';

import { Crest, ResultDot, Score, shortDate } from './parts';

interface Props {
  fixtureId: number;
  date: string;
  league: string | null;
  home: TeamRef;
  away: TeamRef;
  goals: { home: number; away: number };
  /** W/D/L from one club's side, for the Form tab. */
  result?: 'W' | 'D' | 'L';
}

/** A past match: date and competition, then crest–score–crest. Opens that match. */
export default function MatchLine({ fixtureId, date, league, home, away, goals, result }: Props) {
  const router = useRouter();
  return (
    <Touchable
      onPress={() => router.push(`/match/${fixtureId}` as never)}
      accessibilityRole="button"
      style={({ pressed }) => ({ paddingVertical: 10, opacity: pressed ? 0.6 : 1 })}
    >
      <Text className="text-[11px]" style={{ color: Colors.text.tertiary, marginBottom: 6 }} numberOfLines={1}>
        {[shortDate(date), league].filter(Boolean).join(' · ')}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Crest uri={home.logo} size={20} />
        <Text className="text-[13px]" style={{ flex: 1, color: Colors.text.primary }} numberOfLines={1}>
          {home.name}
        </Text>
        <View style={{ minWidth: 52, alignItems: 'center' }}>
          <Score home={goals.home} away={goals.away} size={14} />
        </View>
        <Text className="text-[13px]" style={{ flex: 1, color: Colors.text.primary, textAlign: 'right' }} numberOfLines={1}>
          {away.name}
        </Text>
        <Crest uri={away.logo} size={20} />
        {result ? <ResultDot result={result} /> : null}
      </View>
    </Touchable>
  );
}
