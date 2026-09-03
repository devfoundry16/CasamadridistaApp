import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import { statusLabel, statusTone } from './labels';

interface Props {
  status: string;
  compact?: boolean;
}

/** Editorial status pill. Colour comes from `statusTone`, never from the caller. */
export default function StatusBadge({ status, compact = false }: Props) {
  const { t } = useTranslation();
  const tone = statusTone(status);

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: tone.bg,
        paddingHorizontal: compact ? 6 : 8,
        paddingVertical: compact ? 2 : 3,
        borderRadius: 6,
      }}
    >
      <Text
        className={compact ? 'text-[10px] font-semibold' : 'text-[11px] font-semibold'}
        style={{ color: tone.fg }}
      >
        {statusLabel(t, status)}
      </Text>
    </View>
  );
}
