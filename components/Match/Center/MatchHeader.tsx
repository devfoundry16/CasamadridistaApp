import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import Colors from '@/constants/colors';
import type { MatchSummary } from '@/types/soccer/matchCenter';

import { Crest, Score } from './parts';

/**
 * The sticky match header: competition and round, crest–score–crest, then the
 * kickoff in the phone's own timezone and the stadium. Built from the match
 * centre summary, so it works for any fixture, not only those in the Casa
 * Media mirror.
 */
export default function MatchHeader({ match }: { match: MatchSummary }) {
  const live = match.state === 'live';
  const kickoff = new Date(match.date);
  const when = `${kickoff.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} · ${kickoff.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  const competition = [match.league.name, match.league.round].filter(Boolean).join(' · ');
  const venue = [match.venue.name, match.venue.city].filter(Boolean).join(', ');

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 10,
        backgroundColor: Colors.background.deepDark,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
      }}
    >
      {competition ? (
        <Text className="text-[11px] text-center" style={{ color: Colors.text.tertiary }} numberOfLines={1}>
          {competition}
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
        <Side name={match.home.name} logo={match.home.logo} align="start" />
        <View style={{ alignItems: 'center', paddingHorizontal: 10, minWidth: 82 }}>
          <Score home={match.goals.home} away={match.goals.away} />
          <Text
            className="text-[10px] font-semibold"
            style={{ color: live ? Colors.status.error : Colors.text.tertiary, marginTop: 2 }}
            numberOfLines={1}
          >
            {live && match.status.elapsed != null ? `${match.status.elapsed}'` : match.status.long ?? ''}
          </Text>
        </View>
        <Side name={match.away.name} logo={match.away.logo} align="end" />
      </View>

      <Text className="text-[11px] text-center" style={{ color: Colors.text.secondary, marginTop: 6 }} numberOfLines={1}>
        {venue ? `${when} · ${venue}` : when}
      </Text>
    </View>
  );
}

function Side({ name, logo, align }: { name: string | null; logo: string | null; align: 'start' | 'end' }) {
  return (
    <View style={{ flex: 1, flexDirection: align === 'start' ? 'row' : 'row-reverse', alignItems: 'center' }}>
      <Crest uri={logo} size={28} />
      <Text
        className="text-[13px] font-semibold"
        style={{
          flex: 1,
          color: Colors.text.primary,
          // Physical margins: the row already reverses under RTL.
          marginLeft: align === 'start' ? 8 : 0,
          marginRight: align === 'end' ? 8 : 0,
        }}
        numberOfLines={1}
      >
        {name}
      </Text>
    </View>
  );
}
