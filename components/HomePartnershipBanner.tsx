import AsyncStorage from '@react-native-async-storage/async-storage';
import { X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Text';
import Colors from '@/constants/colors';
import { openPartnershipInquiry } from '@/constants/partnerships';

const DISMISSED_KEY = 'fanClubPartnershipBannerDismissed_v1';

const GOLD = Colors.darkGold;
const BG = 'rgba(188, 144, 69, 0.14)';
const BORDER = 'rgba(188, 144, 69, 0.4)';

export default function HomePartnershipBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_KEY).then((val) => {
      if (val === null) setVisible(true);
    });
  }, []);

  const handleDismiss = async () => {
    await AsyncStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Pressable
      onPress={openPartnershipInquiry}
      style={({ pressed }) => ({
        backgroundColor: BG,
        borderWidth: 1,
        borderColor: BORDER,
        borderLeftWidth: 4,
        borderLeftColor: GOLD,
        opacity: pressed ? 0.75 : 1,
      })}
      className="flex-row items-center px-4 py-3 gap-3"
    >
      <Text
        className="text-sm leading-5 flex-1 font-medium"
        style={{ color: Colors.text.primary }}
        numberOfLines={2}
      >
        {t('fanClubs.partnerBannerText')}
      </Text>
      <Pressable
        onPress={handleDismiss}
        hitSlop={12}
        className="p-1"
        android_ripple={{ color: 'rgba(255,255,255,0.15)', radius: 16 }}
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      >
        <X size={16} color={GOLD} strokeWidth={2.5} />
      </Pressable>
    </Pressable>
  );
}
