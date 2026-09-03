import { Image } from 'expo-image';
import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import Colors from '@/constants/colors';
import type { MediaMatchRef } from '@/types/media/casaMedia';

interface Props {
  match: MediaMatchRef | null | undefined;
  fallbackTitle: string;
}

/** Statuses API-Football reports for a match that is currently being played. */
const LIVE_STATUSES = new Set(['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE']);

export function isLiveStatus(status: string | null | undefined): boolean {
  return !!status && LIVE_STATUSES.has(status);
}

export function isFinishedStatus(status: string | null | undefined): boolean {
  return !!status && (status === 'FT' || status === 'AET' || status === 'PEN');
}

/**
 * Crest — score — crest, pinned above the match tabs.
 *
 * Mounted once by `app/match/[id]/_layout.tsx` so it persists across the three
 * tabs rather than re-mounting per scene (same reasoning as
 * `TeamIdentityHeader` in the team layout).
 */
export default function MatchIdentityStrip({ match, fallbackTitle }: Props) {
  const live = isLiveStatus(match?.status_short);
  const hasScore = match?.goals_home != null && match?.goals_away != null;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: Colors.background.deepDark,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
      }}
    >
      {match ? (
        <>
          <Side team={match.home} align="start" />

          <View style={{ alignItems: 'center', paddingHorizontal: 10, minWidth: 82 }}>
            <Text
              className="text-[18px] font-bold"
              style={{
                color: Colors.text.primary,
                // A scoreline is a physical left-to-right pair; bidi would
                // otherwise render "2-1" as "1-2" beside Arabic text.
                fontVariant: ['tabular-nums'],
                writingDirection: 'ltr',
              }}
            >
              {hasScore ? `${match.goals_home} - ${match.goals_away}` : 'vs'}
            </Text>
            <Text
              className="text-[10px] font-semibold"
              style={{ color: live ? Colors.status.error : Colors.text.tertiary, marginTop: 2 }}
              numberOfLines={1}
            >
              {match.status_long ?? match.status_short ?? ''}
            </Text>
          </View>

          <Side team={match.away} align="end" />
        </>
      ) : (
        <Text
          className="text-[14px] font-semibold"
          style={{ flex: 1, color: Colors.text.secondary, textAlign: 'center' }}
          numberOfLines={1}
        >
          {fallbackTitle}
        </Text>
      )}
    </View>
  );
}

function Side({
  team,
  align,
}: {
  team: MediaMatchRef['home'];
  align: 'start' | 'end';
}) {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: align === 'start' ? 'row' : 'row-reverse',
        alignItems: 'center',
      }}
    >
      {team.logo ? (
        <Image
          source={{ uri: team.logo }}
          style={{ width: 26, height: 26 }}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
      ) : null}
      <Text
        className="text-[13px] font-semibold"
        style={{
          flex: 1,
          color: Colors.text.primary,
          // Physical margin next to the crest: the row itself already
          // reverses under RTL, so `start`/`end` here would double-flip it.
          marginLeft: align === 'start' ? 8 : 0,
          marginRight: align === 'end' ? 8 : 0,
        }}
        numberOfLines={1}
      >
        {team.name}
      </Text>
    </View>
  );
}
