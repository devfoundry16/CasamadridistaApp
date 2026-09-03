import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { Lock, Mail, Phone, User } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';

import { Spinner } from '@/components/Spinner';
import { Text } from '@/components/Text';
import Colors from '@/constants/colors';
import { useUser } from '@/hooks/useUser';
import { buildAttributionPayload } from '@/utils/finishAuthRedirect';

export type AuthMode = 'login' | 'register';

interface Props {
  initialMode?: AuthMode;
  /**
   * Fired once, when a session actually exists. Watching the Redux user rather
   * than a thunk's return value is deliberate: Apple sign-in, email login and a
   * returning OAuth deeplink all land here, and only some of them resolve
   * through this component.
   */
  onSuccess?: () => void;
  /** Overrides the submit-button label — e.g. "Sign up free to watch". */
  ctaLabel?: string;
  /** Item that drove the signup, threaded into the register body. */
  attributionMediaId?: string;
  attributionCampaignId?: string;
  /** The account tab renders this full-bleed; the login modal supplies its own header. */
  showBranding?: boolean;
}

/**
 * The sign-in / sign-up form.
 *
 * Extracted verbatim from `app/(tabs)/account.tsx` so the Casa Media auth gate
 * can present the same form in a modal without a second implementation drifting
 * away from it. The account tab still renders it inline.
 */
export default function AuthForm({
  initialMode = 'login',
  onSuccess,
  ctaLabel,
  attributionMediaId,
  attributionCampaignId,
  showBranding = true,
}: Props) {
  const { user, login, register, signInWithGoogle, signInWithApple, isLoading } = useUser();
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const notified = useRef(false);
  useEffect(() => {
    if (!user?.id || notified.current) return;
    notified.current = true;
    onSuccess?.();
  }, [user?.id, onSuccess]);

  const handleSubmit = async () => {
    if (isLogin) {
      if (!email || !password) {
        Alert.alert(t('common.error'), t('account.pleaseFillAllFields'));
        return;
      }
      login(email, password);
      return;
    }

    if (!email || !password || !firstName || !lastName) {
      Alert.alert(t('common.error'), t('account.pleaseFillRequiredFields'));
      return;
    }
    await register({
      email,
      password,
      firstName,
      lastName,
      phone,
      attribution: await buildAttributionPayload(attributionMediaId, attributionCampaignId),
    });
  };

  const submitLabel = ctaLabel ?? (isLogin ? t('auth.login') : t('auth.register'));

  return (
    <ScrollView className="flex-1 bg-bg-medium" keyboardShouldPersistTaps="handled">
      {showBranding ? (
        <View className="p-8 pt-12 pb-10 items-center">
          <View className="rounded-[22px] overflow-hidden mb-2" style={{ width: 100, height: 100 }}>
            <Image
              source={require('@/assets/icons/splash-icon-dark.png')}
              style={{ width: 100, height: 100 }}
              resizeMode="cover"
            />
          </View>
          <Text className="text-[28px] font-bold text-white mb-2">
            {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
          </Text>
          <Text className="text-base text-text-secondary text-center">
            {isLogin ? t('auth.signInSubtitle') : t('auth.joinSubtitle')}
          </Text>
        </View>
      ) : null}

      <View className="p-6">
        {!isLogin && (
          <>
            <Field
              label={t('auth.firstName')}
              icon={User}
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t('auth.enterFirstName')}
            />
            <Field
              label={t('auth.lastName')}
              icon={User}
              value={lastName}
              onChangeText={setLastName}
              placeholder={t('auth.enterLastName')}
            />
            <Field
              label={t('auth.phone')}
              icon={Phone}
              value={phone}
              onChangeText={setPhone}
              placeholder={t('auth.enterPhone')}
              keyboardType="phone-pad"
            />
          </>
        )}

        <Field
          label={t('auth.emailAddress')}
          icon={Mail}
          value={email}
          onChangeText={setEmail}
          placeholder={t('auth.enterEmail')}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View className="mb-5">
          <Field
            label={t('auth.password')}
            icon={Lock}
            value={password}
            onChangeText={setPassword}
            placeholder={t('auth.enterPassword')}
            secureTextEntry
            noMargin
          />
          {isLogin && (
            <TouchableOpacity
              className="mt-2 self-end"
              onPress={() => router.push('/auth/forgot-password')}
            >
              <Text className="text-sm text-rm-gold underline">
                {t('auth.forgotPasswordTitle')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading && <Spinner content={isLogin ? t('auth.signIn') : t('auth.signUp')} />}
        {!isLoading && (
          <>
            <TouchableOpacity
              className="bg-rm-gold p-4 rounded-[25px] items-center mt-2"
              onPress={handleSubmit}
              accessibilityRole="button"
            >
              <Text className="text-base font-bold text-white">{submitLabel}</Text>
            </TouchableOpacity>

            {isLogin && (
              <>
                <View className="flex-row items-center my-6">
                  <View className="flex-1 h-[1px] bg-border-light" />
                  <Text className="mx-4 text-text-secondary text-sm">{t('common.or')}</Text>
                  <View className="flex-1 h-[1px] bg-border-light" />
                </View>

                <TouchableOpacity
                  className="bg-white p-4 rounded-[25px] items-center flex-row justify-center gap-3 border-2 border-border-light"
                  onPress={() => signInWithGoogle()}
                  accessibilityRole="button"
                >
                  <FontAwesome name="google" size={24} color={Colors.text.dark} />
                  <Text className="text-base font-bold text-text-dark">
                    {t('auth.signInWithGoogle')}
                  </Text>
                </TouchableOpacity>

                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={25}
                  style={{ width: '100%', height: 52, marginTop: 12 }}
                  onPress={() => signInWithApple()}
                />
              </>
            )}
          </>
        )}

        <TouchableOpacity
          className="mt-4 items-center"
          onPress={() => setIsLogin(!isLogin)}
          accessibilityRole="button"
        >
          <Text className="text-sm text-rm-gold underline">
            {isLogin ? t('auth.noAccountRegister') : t('auth.haveAccountLogin')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Field({
  label,
  icon: Icon,
  noMargin = false,
  ...input
}: {
  label: string;
  icon: typeof Mail;
  noMargin?: boolean;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View className={noMargin ? undefined : 'mb-5'}>
      <Text className="text-sm font-semibold text-white mb-2">{label}</Text>
      <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
        <Icon size={18} color={Colors.textLight} />
        <TextInput
          className="flex-1 py-4 text-base text-white"
          // paddingStart, not pl-3: the icon must stay on the leading edge in RTL.
          style={{ paddingStart: 12 }}
          placeholderTextColor={Colors.textLight}
          {...input}
        />
      </View>
    </View>
  );
}
