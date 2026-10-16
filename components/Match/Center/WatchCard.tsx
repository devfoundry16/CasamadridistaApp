import { ExternalLink, Tv } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { Card } from '@/components/Match/Center/parts';
import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { useMatchBroadcasts } from '@/hooks/football/matchCenter';
import { countryName, type Channel } from '@/utils/matchWatch.core';

/**
 * Where to watch, entered by the Casa Media desk: the channels in your
 * country first, then worldwide, then the rest behind "Show other
 * countries". Hidden when nothing is entered.
 */
export default function WatchCard({ matchId }: { matchId: number }) {
  const { t, i18n } = useTranslation();
  const { data } = useMatchBroadcasts(matchId);
  const [open, setOpen] = useState(false);
  if (!data) return null;

  const name = (code: string) => countryName(code, i18n.language);
  return (
    <Card title={t('match.center.watchTitle')}>
      {data.country && data.here.length ? (
        <Group label={t('match.center.watchHere', { country: name(data.country) })} channels={data.here} />
      ) : null}
      {data.worldwide.length ? <Group label={t('match.center.watchWorldwide')} channels={data.worldwide} /> : null}
      {data.others.length ? (
        open ? (
          <>
            <Text className="text-[12px] font-semibold mt-2" style={{ color: Colors.text.tertiary }}>
              {t('match.center.watchOthers')}
            </Text>
            {data.others.map((g) => (
              <Group key={g.country_code} label={name(g.country_code)} channels={g.channels} />
            ))}
          </>
        ) : (
          <Touchable onPress={() => setOpen(true)} accessibilityRole="button" style={{ paddingVertical: 8 }}>
            <Text className="text-[13px] font-semibold" style={{ color: Colors.darkGold }}>
              {t('match.center.watchOthersShow', { count: data.others.length })}
            </Text>
          </Touchable>
        )
      ) : null}
    </Card>
  );
}

function Group({ label, channels }: { label: string; channels: Channel[] }) {
  return (
    <View style={{ paddingVertical: 6 }}>
      <Text className="text-[12px]" style={{ color: Colors.text.tertiary, marginBottom: 4 }}>
        {label}
      </Text>
      {channels.map((c) => (
        <Touchable
          key={c.channel}
          disabled={!c.url}
          onPress={() => c.url && void Linking.openURL(c.url)}
          accessibilityRole={c.url ? 'link' : 'text'}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 }}
        >
          <Tv size={16} color={Colors.darkGold} />
          <Text className="text-[14px] font-semibold" style={{ flex: 1, color: Colors.text.primary }}>
            {c.channel}
          </Text>
          {c.url ? <ExternalLink size={14} color={Colors.text.tertiary} /> : null}
        </Touchable>
      ))}
    </View>
  );
}
