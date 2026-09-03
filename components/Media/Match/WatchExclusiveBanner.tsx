import { ChevronRight, Clapperboard } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';

interface Props {
  count: number;
  onPress: () => void;
}

/**
 * "Exclusive coverage is up" prompt, shown on the match page once the whistle
 * has gone and the correspondent has actually published something. Rendered
 * only when `count > 0` — an empty promise is worse than no banner.
 */
export default function WatchExclusiveBanner({ count, onPress }: Props) {
  const { t } = useTranslation();
  if (count <= 0) return null;

  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('casaMedia.watchExclusive')}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: Colors.background.card,
        borderWidth: 1,
        borderColor: Colors.darkGold,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Clapperboard size={20} color={Colors.darkGold} />
      <View style={{ flex: 1, marginStart: 12 }}>
        <Text className="text-[14px] font-bold" style={{ color: Colors.text.primary }}>
          {t('casaMedia.watchExclusive')}
        </Text>
        <Text className="text-[12px]" style={{ color: Colors.text.tertiary, marginTop: 2 }}>
          {t('casaMedia.watchExclusiveCount', { value: count })}
        </Text>
      </View>
      <ChevronRight size={18} color={Colors.text.tertiary} />
    </Touchable>
  );
}
