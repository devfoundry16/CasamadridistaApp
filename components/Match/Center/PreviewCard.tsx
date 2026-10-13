import { Sparkles } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card } from '@/components/Match/Center/parts';
import { Text } from '@/components/Text';
import Colors from '@/constants/colors';
import { useMatchPreview } from '@/hooks/football/matchCenter';

/**
 * The AI match preview on the Details tab, before kickoff: written by the
 * server from the facts this screen shows, badged as AI-generated, in the
 * app's language. Nothing shows when there is none (or it is still switched
 * off for fans); an admin sees it early, marked hidden from fans.
 */
export default function PreviewCard({ matchId }: { matchId: number }) {
  const { t, i18n } = useTranslation();
  const { data } = useMatchPreview(matchId);
  if (!data) return null;

  const arabic = i18n.language?.startsWith('ar');
  const body = arabic ? data.ar : data.en;
  const generated = new Date(data.generated_at);
  const at = Number.isNaN(generated.getTime())
    ? ''
    : generated.toLocaleString(i18n.language, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <Card title={t('match.center.previewTitle')}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Sparkles size={14} color={Colors.darkGold} />
        <Text className="text-[12px] font-semibold" style={{ color: Colors.darkGold }}>
          {t('match.center.previewBadge')}
        </Text>
      </View>
      {data.hidden_from_fans ? (
        <Text className="text-[12px] mb-2" style={{ color: Colors.status.warning }}>
          {t('match.center.previewHidden')}
        </Text>
      ) : null}
      <Text className="text-[14px] leading-6" style={{ color: Colors.text.primary }}>
        {body}
      </Text>
      <Text className="text-[11px] mt-3" style={{ color: Colors.text.muted }}>
        {t('match.center.previewSource', { time: at })}
      </Text>
    </Card>
  );
}
