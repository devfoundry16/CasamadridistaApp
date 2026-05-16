import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Mail, CheckCircle } from 'lucide-react-native';
import { Text } from '@/components/Text';
import Colors from '@/constants/colors';
import { PARTNERSHIP_EMAIL, openPartnershipInquiry } from '@/constants/partnerships';

export type PartnershipVariant = 'fanClubs' | 'home';

interface FanClubPartnershipSectionProps {
  variant?: PartnershipVariant;
}

export default function FanClubPartnershipSection({
  variant = 'fanClubs',
}: FanClubPartnershipSectionProps) {
  const { t } = useTranslation();

  const bullets = t('fanClubs.partnerBullets', { returnObjects: true }) as string[];

  if (variant === 'home') {
    return (
      <View className="px-5 py-8 bg-bg-medium">
        <View className="flex-row items-center mb-3 gap-2">
          <Mail size={20} color={Colors.darkGold} />
          <Text
            className="text-lg font-bold flex-1"
            style={{ color: Colors.darkGold }}
          >
            {t('fanClubs.partnerNetworkTitle')}
          </Text>
        </View>

        <Text className="text-sm leading-5 opacity-85 mb-2" style={{ color: Colors.text.primary }}>
          {t('fanClubs.partnerLead')}
        </Text>
        <Text className="text-sm leading-5 opacity-75 mb-3" style={{ color: Colors.text.primary }}>
          {t('fanClubs.partnerPlatform')}
        </Text>

        <Text className="text-sm font-semibold mb-2" style={{ color: Colors.text.primary }}>
          {t('fanClubs.partnerWePartnerIntro')}
        </Text>

        {Array.isArray(bullets) &&
          bullets.map((bullet, i) => (
            <View key={i} className="flex-row items-start mb-1.5 gap-2">
              <CheckCircle size={14} color={Colors.darkGold} style={{ marginTop: 2 }} />
              <Text className="text-sm leading-5 flex-1 opacity-80" style={{ color: Colors.text.primary }}>
                {bullet}
              </Text>
            </View>
          ))}

        <Pressable
          onPress={openPartnershipInquiry}
          className="py-3.5 rounded-xl items-center mt-4 mb-2"
          style={{ backgroundColor: Colors.darkGold }}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        >
          <Text className="text-white font-bold text-sm">{t('fanClubs.partnerCta')}</Text>
        </Pressable>

        <Pressable onPress={openPartnershipInquiry} className="items-center py-1.5">
          <Text className="text-sm opacity-70" style={{ color: Colors.darkGold }}>
            {t('fanClubs.partnerEmailLabel')}
          </Text>
        </Pressable>

        <Pressable onPress={openPartnershipInquiry} className="items-center py-1">
          <Text
            className="text-sm underline text-center"
            style={{ color: Colors.darkGold }}
          >
            {t('fanClubs.applyHere')}
          </Text>
        </Pressable>
      </View>
    );
  }

  // fanClubs variant — gold card matching existing footer style
  return (
    <View
      className="mx-4 my-6 rounded-2xl p-5 items-center"
      style={{ backgroundColor: Colors.primary, opacity: 1 }}
    >
      <Mail size={28} color="#fff" />

      <Text
        className="text-base font-bold text-center mt-3 mb-1 text-white"
      >
        {t('fanClubs.partnerNetworkTitle')}
      </Text>

      <Text className="text-sm text-center opacity-85 mb-1 text-white">
        {t('fanClubs.partnerLead')}
      </Text>
      <Text className="text-sm text-center opacity-75 mb-3 text-white">
        {t('fanClubs.partnerPlatform')}
      </Text>

      <Text className="text-sm font-semibold mb-2 text-white self-start">
        {t('fanClubs.partnerWePartnerIntro')}
      </Text>

      {Array.isArray(bullets) &&
        bullets.map((bullet, i) => (
          <View key={i} className="flex-row items-start mb-1.5 gap-2 self-start">
            <CheckCircle size={13} color="#fff" style={{ marginTop: 2 }} />
            <Text className="text-sm leading-5 flex-1 opacity-85 text-white">
              {bullet}
            </Text>
          </View>
        ))}

      <Pressable
        onPress={openPartnershipInquiry}
        className="py-3 px-6 rounded-xl w-full items-center mt-4 mb-2"
        style={{ backgroundColor: Colors.background.dark }}
        android_ripple={{ color: 'rgba(188,144,69,0.3)' }}
      >
        <Text className="text-white font-semibold text-sm">{t('fanClubs.partnerCta')}</Text>
      </Pressable>

      <Pressable onPress={openPartnershipInquiry} className="py-1.5">
        <Text className="text-sm opacity-80 text-white text-center">
          {t('fanClubs.partnerEmailLabel')}
        </Text>
      </Pressable>

      <Pressable onPress={openPartnershipInquiry} className="py-1">
        <Text className="text-sm underline text-center text-white opacity-80">
          {t('fanClubs.applyHere')}
        </Text>
      </Pressable>
    </View>
  );
}
