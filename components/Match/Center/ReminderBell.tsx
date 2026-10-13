import { Bell, BellRing, CalendarPlus, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Platform } from 'react-native';

import ActionSheet, { type SheetAction } from '@/components/Social/ActionSheet';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import MatchCenterService from '@/services/Football/MatchCenterService';
import type { MatchSummary } from '@/types/soccer/matchCenter';
import { REMINDER_OFFSETS, calendarTemplateUrl, type SavedReminder } from '@/utils/matchExtras.core';
import { clearReminder, setReminder, syncReminder } from '@/utils/matchReminders';

/**
 * The bell on an upcoming match's header: remind me an hour before, 15
 * minutes before or at kickoff, add the match to the calendar, or turn the
 * reminder off. A reminder already set follows a moved kickoff.
 */
export default function ReminderBell({ match }: { match: MatchSummary }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<SavedReminder | null>(null);
  const reminderMatch = { id: match.id, date: match.date, home: match.home, away: match.away };

  // Plain values as dependencies: the summary refetches every minute near
  // kickoff with new objects, and only a moved kickoff needs another sync.
  const homeName = match.home.name;
  const awayName = match.away.name;
  useEffect(() => {
    let live = true;
    void syncReminder({ id: match.id, date: match.date, home: { name: homeName }, away: { name: awayName } })
      .then((r) => live && setSaved(r))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [match.id, match.date, homeName, awayName]);

  const choose = useCallback(
    async (offsetMin: number) => {
      const result = await setReminder(reminderMatch, offsetMin).catch(() => 'failed' as const);
      if (result === 'set') {
        setSaved({ notificationId: '', offsetMin, kickoff: match.date });
        Alert.alert(t('match.center.reminderSet'));
      } else if (result === 'denied') {
        Alert.alert(t('match.center.reminderDenied'), undefined, [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('match.center.openSettings'), onPress: () => void Linking.openSettings() },
        ]);
      } else if (result === 'past') {
        Alert.alert(t('match.center.reminderPast'));
      } else {
        Alert.alert(t('common.error'));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [match.id, match.date, t],
  );

  const addToCalendar = () => {
    const url = Platform.OS === 'ios' ? MatchCenterService.calendarUrl(match.id) : calendarTemplateUrl(match);
    if (url) void Linking.openURL(url).catch(() => Alert.alert(t('common.error')));
  };

  const label = (offset: number) => t(`match.center.reminder${offset}`);
  const actions: SheetAction[] = [
    ...REMINDER_OFFSETS.map((offset) => ({
      key: `r${offset}`,
      label: saved?.offsetMin === offset ? `✓ ${label(offset)}` : label(offset),
      icon: <Bell size={20} color={Colors.text.primary} />,
      onPress: () => void choose(offset),
    })),
    {
      key: 'calendar',
      label: t('match.center.addToCalendar'),
      icon: <CalendarPlus size={20} color={Colors.text.primary} />,
      onPress: addToCalendar,
    },
    ...(saved
      ? [{
          key: 'off',
          label: t('match.center.reminderOff'),
          icon: <X size={20} color={Colors.status.error} />,
          destructive: true,
          onPress: () => void clearReminder(match.id).then(() => setSaved(null)),
        }]
      : []),
  ];

  return (
    <>
      <Touchable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={saved ? t('match.center.reminderOn') : t('match.center.reminderButton')}
        hitSlop={10}
        style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.6 : 1 })}
      >
        {saved ? <BellRing size={20} color={Colors.darkGold} /> : <Bell size={20} color={Colors.text.secondary} />}
      </Touchable>
      <ActionSheet
        visible={open}
        title={t('match.center.reminderTitle')}
        onClose={() => setOpen(false)}
        cancelLabel={t('common.cancel')}
        actions={actions}
      />
    </>
  );
}
