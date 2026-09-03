import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import AuthForm, { type AuthMode } from '@/components/Auth/AuthForm';
import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { clearPendingReturnTo } from '@/utils/returnTo';
import { finishAuthRedirect } from '@/utils/finishAuthRedirect';

/**
 * The auth gate's modal.
 *
 * Reached from `useRequireAuth`, which has already written the pending returnTo
 * to storage — the query params here are only for labelling the CTA and seeding
 * the attribution. On success `finishAuthRedirect` consumes that pending intent
 * and replaces to it, which is the same path the OAuth deeplink takes, so a
 * Google round-trip through the browser lands in exactly the same place.
 */
export default function LoginModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mediaId, mode } = useLocalSearchParams<{
    returnTo?: string;
    mediaId?: string;
    mode?: string;
  }>();

  const initialMode: AuthMode = mode === 'login' ? 'login' : 'register';

  const handleClose = useCallback(() => {
    // The user backed out: drop the pending intent so a later, unrelated sign-in
    // does not teleport them into a media item they have forgotten about.
    void clearPendingReturnTo();
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/account');
  }, [router]);

  const handleSuccess = useCallback(() => {
    void finishAuthRedirect();
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: Colors.background.medium }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: 16,
          }}
        >
          <Text className="text-[17px] font-bold" style={{ flex: 1, color: Colors.text.primary }}>
            {initialMode === 'login' ? t('auth.welcomeBack') : t('auth.modalTitle')}
          </Text>
          <Touchable
            onPress={handleClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
            style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.6 : 1 })}
          >
            <X size={22} color={Colors.text.tertiary} />
          </Touchable>
        </View>

        <Text
          className="text-[13px] leading-5"
          style={{ color: Colors.text.secondary, paddingHorizontal: 16, paddingTop: 6 }}
        >
          {mediaId ? t('auth.modalMediaSubtitle') : t('auth.modalSubtitle')}
        </Text>

        <AuthForm
          initialMode={initialMode}
          onSuccess={handleSuccess}
          attributionMediaId={mediaId}
          ctaLabel={
            initialMode === 'register' && mediaId ? t('casaMedia.signUpToWatch') : undefined
          }
          showBranding={false}
        />
      </View>
    </>
  );
}
