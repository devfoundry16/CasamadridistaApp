import { Check } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { usePollVote } from '@/hooks/usePostPoll';
import type { Post } from '@/services/FeedService';
import { closesIn, type PollTally } from '@/utils/poll.core';

interface Props {
  post: Post;
}

/** The poll's options with what the server sent; its options alone while loading. */
function optionsOf(post: Post, tally: PollTally | undefined) {
  if (tally) return tally.options;
  return [...(post.poll?.options ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((o) => ({ id: o.id, label: o.label, count: null, percent: null }));
}

/**
 * A poll post's options: tap one to vote, tap another to change the vote
 * while the poll is open. Results (bars and percentages) show once you have
 * voted, once it has closed, and always to its author: the server sends no
 * counts before that, so a vote is not steered by the standings.
 */
export default function PollCard({ post }: Props) {
  const { t } = useTranslation();
  const { tally, state, choose } = usePollVote(post);
  const options = optionsOf(post, tally);
  const left = closesIn(tally?.closes_at ?? post.poll?.closes_at ?? '');

  const footer = [
    state.showResults && tally?.total !== null && tally?.total !== undefined
      ? t('community.poll.votes', { count: tally.total })
      : null,
    left
      ? t(left.unit === 'days' ? 'community.poll.closesInDays' : left.unit === 'hours' ? 'community.poll.closesInHours' : 'community.poll.closesInMinutes', { count: left.count })
      : t('community.poll.final'),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.container}>
      {options.map((o) => {
        const mine = tally?.mine === o.id;
        const percent = state.showResults ? o.percent ?? 0 : null;
        return (
          <Touchable
            key={o.id}
            onPress={() => choose(o.id)}
            disabled={!state.canVote && !state.askSignIn}
            accessibilityRole="button"
            accessibilityState={{ selected: mine, disabled: !state.canVote && !state.askSignIn }}
            accessibilityLabel={[o.label, percent !== null ? `${percent}%` : null, mine ? t('community.poll.yourVote') : null].filter(Boolean).join(', ')}
            style={({ pressed }) => [styles.option, mine && styles.optionMine, { opacity: pressed ? 0.85 : 1 }]}
          >
            {percent !== null ? <View style={[styles.fill, mine && styles.fillMine, { width: `${percent}%` }]} /> : null}
            <View style={styles.row}>
              <Text style={[styles.label, mine && styles.labelMine]} numberOfLines={2}>
                {o.label}
              </Text>
              {mine ? <Check size={14} color={Colors.darkGold} style={styles.check} /> : null}
              {percent !== null ? <Text style={[styles.percent, mine && styles.labelMine]}>{percent}%</Text> : null}
            </View>
          </Touchable>
        );
      })}
      <Text style={styles.footer}>
        {footer}
        {state.askSignIn ? ` · ${t('community.poll.signIn')}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 8,
  },
  option: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.medium,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  optionMine: {
    borderColor: Colors.darkGold,
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    backgroundColor: Colors.background.light,
  },
  fillMine: {
    backgroundColor: 'rgba(188,144,69,0.28)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    // The start side in both directions ('left' is swapped to the right under
    // RTL): a Latin option in the Arabic layout would otherwise align by its
    // own script, against its percentage.
    textAlign: 'left',
  },
  labelMine: {
    color: Colors.darkGold,
  },
  check: {
    marginHorizontal: 6,
  },
  percent: {
    marginStart: 8,
    color: Colors.text.secondary,
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  footer: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
});
