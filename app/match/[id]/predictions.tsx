import { isAxiosError } from 'axios';
import { useGlobalSearchParams } from 'expo-router';
import { Vote } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, View } from 'react-native';

import { Card, Crest, TabScroll } from '@/components/Match/Center/parts';
import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { useMatchPredictions, useVotePrediction, useWithSummary } from '@/hooks/football/matchCenter';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useUser } from '@/hooks/useUser';
import type { MatchSummary, PollPick, PredictionTally } from '@/types/soccer/matchCenter';
import { pollView } from '@/utils/matchCenter.core';

/**
 * Fan predictions: one pick per account (home win, draw, away win), which can
 * be changed until kickoff. It is labelled as what fans think, never as odds,
 * and the app shows no betting odds anywhere.
 */
export default function MatchPredictionsTab() {
  const { id } = useGlobalSearchParams();
  const matchId = Number.parseInt(String(id ?? ''), 10);
  const { t } = useTranslation();
  const { query, summary } = useWithSummary(useMatchPredictions(matchId), matchId);

  return (
    <TabScroll
      query={query}
      isEmpty={() => !summary}
      empty={{ icon: Vote, title: t('match.center.noData') }}
    >
      {(tally) => (summary ? <Poll matchId={matchId} match={summary.match} tally={tally} /> : null)}
    </TabScroll>
  );
}

function Poll({ matchId, match, tally }: { matchId: number; match: MatchSummary; tally: PredictionTally }) {
  const { t } = useTranslation();
  const { user } = useUser();
  const requireAuth = useRequireAuth();
  const vote = useVotePrediction(matchId);
  const view = pollView(tally, !!user?.id);

  const options: { pick: PollPick; label: string; logo: string | null }[] = [
    { pick: 'home', label: t('match.center.pollHome', { team: match.home.name }), logo: match.home.logo },
    { pick: 'draw', label: t('match.center.pollDraw'), logo: null },
    { pick: 'away', label: t('match.center.pollAway', { team: match.away.name }), logo: match.away.logo },
  ];

  const choose = (pick: PollPick) => {
    if (!view.canVote || vote.isPending) return;
    vote.mutate(pick, {
      onError: (e) => {
        // 409: kickoff has passed. The hook reloads the poll, which then
        // reads as closed; "try again" would be wrong.
        if (isAxiosError(e) && e.response?.status === 409) return Alert.alert(t('match.center.pollClosed'));
        Alert.alert(t('match.center.pollFailed'));
      },
    });
  };

  return (
    <Card title={t('match.center.pollTitle')}>
      <Text className="text-[15px] font-semibold" style={{ color: Colors.text.primary, marginTop: 4 }}>
        {t('match.center.pollQuestion')}
      </Text>
      <Text className="text-[12px]" style={{ color: Colors.text.tertiary, marginTop: 2, marginBottom: 12 }}>
        {t('match.center.pollNote')}
      </Text>

      <View style={{ gap: 10 }}>
        {options.map((o) => {
          const mine = tally.mine === o.pick;
          const share = tally.percentages[o.pick];
          return (
            <Touchable
              key={o.pick}
              onPress={() => choose(o.pick)}
              disabled={!view.canVote}
              accessibilityRole="button"
              accessibilityState={{ selected: mine, disabled: !view.canVote }}
              accessibilityLabel={view.showResults ? `${o.label}, ${share}%` : o.label}
              style={({ pressed }) => ({
                minHeight: 48,
                borderRadius: 12,
                borderWidth: mine ? 2 : 1,
                borderColor: mine ? Colors.darkGold : Colors.border.light,
                overflow: 'hidden',
                opacity: pressed ? 0.75 : 1,
                justifyContent: 'center',
              })}
            >
              {view.showResults ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    start: 0,
                    width: `${share}%`,
                    backgroundColor: mine ? 'rgba(188,144,69,0.35)' : Colors.background.light,
                  }}
                />
              ) : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 }}>
                {o.logo ? <Crest uri={o.logo} size={20} /> : null}
                <Text className="text-[14px] font-semibold" style={{ flex: 1, color: Colors.text.primary }} numberOfLines={1}>
                  {o.label}
                </Text>
                {mine ? (
                  <Text className="text-[11px] font-bold" style={{ color: Colors.darkGold }}>
                    {t('match.center.pollYourPick')}
                  </Text>
                ) : null}
                {view.showResults ? (
                  <Text className="text-[14px] font-bold" style={{ color: Colors.text.primary, fontVariant: ['tabular-nums'] }}>
                    {share}%
                  </Text>
                ) : null}
              </View>
            </Touchable>
          );
        })}
      </View>

      <View style={{ marginTop: 12, alignItems: 'center', gap: 6 }}>
        {vote.isPending ? <ActivityIndicator color={Colors.darkGold} /> : null}
        {view.showResults ? (
          <Text className="text-[12px]" style={{ color: Colors.text.tertiary }}>
            {tally.total ? t('match.center.pollVotes', { count: tally.total }) : t('match.center.pollNoVotes')}
          </Text>
        ) : null}
        {!tally.open ? (
          <Text className="text-[12px]" style={{ color: Colors.text.tertiary }}>
            {t('match.center.pollClosed')}
          </Text>
        ) : null}
        {view.canVote && tally.mine ? (
          <Text className="text-[12px]" style={{ color: Colors.text.tertiary }}>
            {t('match.center.pollChange')}
          </Text>
        ) : null}
        {view.askSignIn ? (
          <Touchable
            onPress={() => requireAuth({ href: `/match/${matchId}?tab=predictions`, mode: 'login' })}
            accessibilityRole="button"
            style={({ pressed }) => ({
              marginTop: 4,
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 12,
              backgroundColor: Colors.darkGold,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text className="text-[13px] font-semibold" style={{ color: Colors.text.dark }}>
              {t('match.center.pollSignIn')}
            </Text>
          </Touchable>
        ) : null}
      </View>
    </Card>
  );
}
