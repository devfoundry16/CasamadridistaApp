import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, Crest } from '@/components/Match/Center/parts';
import { Text } from '@/components/Text';
import Colors from '@/constants/colors';
import { useMatchTrophies } from '@/hooks/football/matchCenter';

/**
 * The two clubs' trophies side by side, entered by the Casa Media desk
 * (API-Football has no club honours), labelled with that source. Hidden
 * unless both clubs are entered.
 */
export default function TrophiesCard({ matchId }: { matchId: number }) {
  const { t, i18n } = useTranslation();
  const { data } = useMatchTrophies(matchId);
  if (!data) return null;

  const updated = data.updatedAt ? new Date(data.updatedAt) : null;
  const at = updated && !Number.isNaN(updated.getTime())
    ? updated.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  const num = (n: number) => (
    <Text className="text-[15px] font-bold" style={{ width: 44, textAlign: 'center', color: Colors.text.primary, writingDirection: 'ltr', fontVariant: ['tabular-nums'] }}>
      {String(n)}
    </Text>
  );

  return (
    <Card title={t('match.center.trophiesTitle')}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 8 }}>
        <View style={{ width: 44, alignItems: 'center' }}>
          <Crest uri={data.home.logo} />
        </View>
        <View style={{ flex: 1 }} />
        <View style={{ width: 44, alignItems: 'center' }}>
          <Crest uri={data.away.logo} />
        </View>
      </View>
      {data.rows.map((r) => (
        <View
          key={r.competition}
          accessible
          accessibilityLabel={`${t(`match.center.trophy.${r.competition}`)}: ${data.home.name ?? ''} ${r.home}, ${data.away.name ?? ''} ${r.away}`}
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7 }}
        >
          {num(r.home)}
          <Text className="text-[13px]" style={{ flex: 1, textAlign: 'center', color: Colors.text.secondary }}>
            {t(`match.center.trophy.${r.competition}`)}
          </Text>
          {num(r.away)}
        </View>
      ))}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, marginTop: 4, borderTopWidth: 1, borderTopColor: Colors.border.default }}>
        {num(data.totals.home)}
        <Text className="text-[13px] font-semibold" style={{ flex: 1, textAlign: 'center', color: Colors.text.primary }}>
          {t('match.center.trophiesTotal')}
        </Text>
        {num(data.totals.away)}
      </View>
      <Text className="text-[11px] mt-3" style={{ color: Colors.text.muted }}>
        {t('match.center.trophiesSource', { time: at })}
      </Text>
    </Card>
  );
}
