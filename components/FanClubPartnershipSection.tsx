import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Mail, CheckCircle } from 'lucide-react-native';
import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { openPartnershipInquiry } from '@/constants/partnerships';

export type PartnershipVariant = 'fanClubs' | 'home' | 'feed';

interface FanClubPartnershipSectionProps {
  variant?: PartnershipVariant;
}

export default function FanClubPartnershipSection({
  variant = 'fanClubs',
}: FanClubPartnershipSectionProps) {
  const { t } = useTranslation();

  const bullets = t('fanClubs.partnerBullets', { returnObjects: true }) as string[];

  // Compact card pinned above the Fan Clubs feed. The full pitch (bullets, email,
  // apply link) stays on the /fan-clubs screens — pinning ~400px above a feed
  // would leave under 300px for posts on a standard phone.
  if (variant === 'feed') {
    return (
      <View
        className="mx-4 mt-3 mb-2 rounded-2xl p-4"
        style={{
          // bg-card, not bg-medium: the community screen background IS bg-medium,
          // so the fanClubs variant would be invisible against it.
          backgroundColor: Colors.background.card,
          borderWidth: 1,
          borderColor: 'rgba(188,144,69,0.35)',
        }}
      >
        <View className="flex-row items-start gap-2 mb-1.5">
          <Mail size={18} color={Colors.darkGold} style={{ marginTop: 1 }} />
          <Text
            className="text-[15px] font-bold flex-1"
            style={{ color: Colors.text.primary }}
          >
            {t('fanClubs.partnerNetworkTitle')}
          </Text>
        </View>

        <Text
          className="text-[13px] leading-5 mb-3"
          numberOfLines={2}
          style={{ color: Colors.text.secondary }}
        >
          {t('fanClubs.partnerLead')}
        </Text>

        <Touchable
          onPress={openPartnershipInquiry}
          accessibilityRole="button"
          className="py-2.5 rounded-xl items-center justify-center"
          style={({ pressed }) => ({ backgroundColor: Colors.darkGold, opacity: pressed ? 0.7 : 1 })}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        >
          <Text className="text-white font-bold text-[13px]">{t('fanClubs.partnerCta')}</Text>
        </Touchable>
      </View>
    );
  }

  if (variant === 'home') {
    return (
      <View className="px-5 py-8 bg-bg-medium">
        <View className="flex-row items-center mb-3 gap-2">
          <Mail size={20} color={Colors.darkGold} />
          <Text
            className="text-lg font-bold flex-1"
            style={{ color: Colors.text.primary }}
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
              <CheckCircle size={14} color={Colors.text.tertiary} style={{ marginTop: 2 }} />
              <Text className="text-sm leading-5 flex-1 opacity-80" style={{ color: Colors.text.primary }}>
                {bullet}
              </Text>
            </View>
          ))}

        <Touchable
          onPress={openPartnershipInquiry}
          className="py-3.5 rounded-xl items-center mt-4 mb-2"
          style={({ pressed }) => ({ backgroundColor: Colors.darkGold, opacity: pressed ? 0.7 : 1 })}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
        >
          <Text className="text-white font-bold text-sm">{t('fanClubs.partnerCta')}</Text>
        </Touchable>

        <Touchable onPress={openPartnershipInquiry} className="items-center py-1.5" style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <Text className="text-sm opacity-70" style={{ color: Colors.darkGold }}>
            {t('fanClubs.partnerEmailLabel')}
          </Text>
        </Touchable>

        <Touchable onPress={openPartnershipInquiry} className="items-center py-1" style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <Text
            className="text-sm underline text-center"
            style={{ color: Colors.darkGold }}
          >
            {t('fanClubs.applyHere')}
          </Text>
        </Touchable>
      </View>
    );
  }

  // fanClubs variant
  return (
    <View
      className="mx-4 my-6 rounded-2xl p-5 items-center"
      style={{
        backgroundColor: Colors.background.medium,
        borderWidth: 1,
        borderColor: 'rgba(188,144,69,0.35)',
      }}
    >
      <Mail size={28} color={Colors.darkGold} />

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
            <CheckCircle size={13} color={Colors.darkGold} style={{ marginTop: 2 }} />
            <Text className="text-sm leading-5 flex-1 opacity-85 text-white">
              {bullet}
            </Text>
          </View>
        ))}

      <Touchable
        onPress={openPartnershipInquiry}
        className="py-3 px-6 rounded-xl w-full items-center mt-4 mb-2"
        style={({ pressed }) => ({ backgroundColor: Colors.darkGold, opacity: pressed ? 0.7 : 1 })}
        android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
      >
        <Text className="text-white font-semibold text-sm">{t('fanClubs.partnerCta')}</Text>
      </Touchable>

      <Touchable onPress={openPartnershipInquiry} className="py-1.5" style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
        <Text className="text-sm opacity-70 text-center" style={{ color: Colors.darkGold }}>
          {t('fanClubs.partnerEmailLabel')}
        </Text>
      </Touchable>

      <Touchable onPress={openPartnershipInquiry} className="py-1" style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
        <Text className="text-sm underline text-center" style={{ color: Colors.darkGold }}>
          {t('fanClubs.applyHere')}
        </Text>
      </Touchable>
    </View>
  );
}
