import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { Crown, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { useUser } from '@/hooks/useUser';
import SubscriptionService from '@/services/SubscriptionService';

const DISMISSED_KEY = '@home_membership_strip_dismissed';

/**
 * Home's one-line membership call to action, in place of the old full-screen
 * hero. Hidden once closed, and for a signed-in fan with an active
 * membership. Checked again each time Home comes into view, so signing in as
 * a member or buying a membership hides it. Storage failures only mean it
 * shows again.
 */
export default function MembershipStrip() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useUser();
  const [visible, setVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        let dismissed = false;
        try {
          dismissed = (await AsyncStorage.getItem(DISMISSED_KEY)) === '1';
        } catch {}
        const member = !dismissed && user?.id ? !!(await SubscriptionService.getActiveSubscription()) : false;
        if (!cancelled) setVisible(!dismissed && !member);
      })();
      return () => {
        cancelled = true;
      };
    }, [user?.id]),
  );

  const dismiss = () => {
    setVisible(false);
    AsyncStorage.setItem(DISMISSED_KEY, '1').catch(() => {});
  };

  if (!visible) return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 12,
        marginTop: 12,
        paddingStart: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.darkGold,
        backgroundColor: 'rgba(188,144,69,0.12)',
      }}
    >
      <Crown size={18} color={Colors.darkGold} />
      <Touchable
        onPress={() => router.push('/memberships/royal-investor')}
        accessibilityRole="link"
        style={({ pressed }) => ({ flex: 1, paddingVertical: 12, paddingHorizontal: 10, opacity: pressed ? 0.7 : 1 })}
      >
        <Text className="text-[13px]" style={{ color: Colors.text.primary }} numberOfLines={2}>
          {t('home.memberStrip')}{' '}
          <Text className="text-[13px] font-bold" style={{ color: Colors.darkGold }}>
            {t('home.memberStripCta')}
          </Text>
        </Text>
      </Touchable>
      <Pressable
        onPress={dismiss}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('common.close')}
        style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
      >
        <X size={16} color={Colors.text.tertiary} />
      </Pressable>
    </View>
  );
}
