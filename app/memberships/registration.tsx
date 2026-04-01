import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FileText, RefreshCw } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Spinner } from '@/components/Spinner';
import MemberRegistrationService, {
  MemberRegistration,
  MemberRegistrationInput,
} from '@/services/MemberRegistrationService';
import { useUser } from '@/hooks/useUser';
import Colors from '@/constants/colors';
interface FormField {
  key: keyof FormState;
  labelKey: string;
  placeholderKey: string;
  required?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
}
interface FormState {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  fanClubName: string;
  madristaCardNumber: string;
  signatureFullName: string;
}
const FIELDS: FormField[] = [
  { key: 'fullName',            labelKey: 'registration.fullName',            placeholderKey: 'registration.fullNamePlaceholder',            required: true,  autoCapitalize: 'words' },
  { key: 'email',               labelKey: 'registration.email',               placeholderKey: 'registration.emailPlaceholder',               required: true,  keyboardType: 'email-address', autoCapitalize: 'none' },
  { key: 'phone',               labelKey: 'registration.phone',               placeholderKey: 'registration.phonePlaceholder',               required: true,  keyboardType: 'phone-pad' },
  { key: 'city',                labelKey: 'registration.city',                placeholderKey: 'registration.cityPlaceholder',                required: true,  autoCapitalize: 'words' },
  { key: 'country',             labelKey: 'registration.country',             placeholderKey: 'registration.countryPlaceholder',             required: true,  autoCapitalize: 'words' },
  { key: 'fanClubName',         labelKey: 'registration.fanClubName',         placeholderKey: 'registration.fanClubNamePlaceholder',         required: true,  autoCapitalize: 'words' },
  { key: 'madristaCardNumber',  labelKey: 'registration.madristaCardNumber',  placeholderKey: 'registration.madristaCardNumberPlaceholder',  required: false, autoCapitalize: 'none' },
  { key: 'signatureFullName',   labelKey: 'registration.signatureFullName',   placeholderKey: 'registration.signatureFullNamePlaceholder',   required: true,  autoCapitalize: 'words' },
];
const EMPTY_FORM: FormState = {
  fullName: '',
  email: '',
  phone: '',
  city: '',
  country: '',
  fanClubName: '',
  madristaCardNumber: '',
  signatureFullName: '',
};
function registrationToFormState(reg: MemberRegistration): FormState {
  return {
    fullName:           reg.full_name,
    email:              reg.email,
    phone:              reg.phone,
    city:               reg.city,
    country:            reg.country,
    fanClubName:        reg.fan_club_name,
    madristaCardNumber: reg.madridista_card_number || '',
    signatureFullName:  reg.signature_full_name,
  };
}
export default function MemberRegistrationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useUser();
  // Optional pre-fill params from fan-clubs flow
  const params = useLocalSearchParams<{
    fanClubId?: string;
    fanClubName?: string;
    country?: string;
  }>();
  // Primitives only — the params object from useLocalSearchParams is often a new
  // reference every render; putting it in useCallback deps re-ran loadExisting on
  // every keystroke and reset the form.
  const fanClubIdParam = params.fanClubId;
  const fanClubNameParam = params.fanClubName;
  const countryParam = params.country;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existingRegistration, setExistingRegistration] = useState<MemberRegistration | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Ref map for sequential TextInput focus
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const loadExisting = useCallback(async () => {
    try {
      setLoadError(null);
      const existing = await MemberRegistrationService.getRegistration();
      if (existing) {
        setExistingRegistration(existing);
        setForm(registrationToFormState(existing));
      } else {
        // Pre-fill from user profile + navigation params
        const profile = user?.profile;
        setForm({
          ...EMPTY_FORM,
          fullName: profile
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
            : '',
          email:   profile?.email || user?.email || '',
          phone:   profile?.phone || '',
          country: countryParam || '',
          fanClubName: fanClubNameParam ? decodeURIComponent(fanClubNameParam) : '',
        });
      }
    } catch {
      setLoadError(t('registration.errorLoading'));
    } finally {
      setIsLoadingData(false);
    }
  }, [user, fanClubNameParam, countryParam, t]);
  useEffect(() => {
    loadExisting();
  }, [loadExisting]);
  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    FIELDS.forEach(({ key, required, labelKey }) => {
      if (required && !form[key].trim()) {
        newErrors[key] = t('registration.fieldRequired', { field: t(labelKey) });
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload: MemberRegistrationInput = {
        fullName:           form.fullName.trim(),
        email:              form.email.trim(),
        phone:              form.phone.trim(),
        city:               form.city.trim(),
        country:            form.country.trim(),
        fanClubId:          fanClubIdParam || null,
        fanClubName:        form.fanClubName.trim(),
        madristaCardNumber: form.madristaCardNumber.trim() || undefined,
        signatureFullName:  form.signatureFullName.trim(),
      };
      const result = await MemberRegistrationService.upsertRegistration(payload);
      setExistingRegistration(result);
      Alert.alert(
        t('registration.successTitle'),
        result.pdfGenerated
          ? t('registration.successMessage')
          : t('registration.successNoPdf'),
        [{ text: t('common.confirm'), onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('common.error'));
    } finally {
      setIsSaving(false);
    }
  };
  const handleRegeneratePdf = async () => {
    try {
      await MemberRegistrationService.regeneratePdf();
      Alert.alert(t('common.success'), t('registration.regenerateSuccess'));
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };
  if (isLoadingData) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-deep-dark">
        <Spinner content={t('registration.loadingRegistration')} />
      </View>
    );
  }
  if (loadError) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-deep-dark px-6">
        <Text className="text-white text-center mb-4">{loadError}</Text>
        <Pressable
          onPress={loadExisting}
          className="py-3 px-8 rounded-xl"
          style={{ backgroundColor: Colors.darkGold }}
        >
          <Text className="text-white font-semibold">{t('fanClubs.retry')}</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1 bg-bg-deep-dark"
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pt-6 pb-4 items-center">
          <FileText size={36} color={Colors.darkGold} />
          <Text
            className="text-2xl font-bold text-center mt-3 mb-1"
            style={{ color: Colors.darkGold }}
          >
            {t('registration.title')}
          </Text>
          <Text className="text-sm text-center opacity-70" style={{ color: Colors.text.primary }}>
            {t('registration.subtitle')}
          </Text>
          {existingRegistration && (
            <View
              className="mt-3 px-4 py-2 rounded-xl"
              style={{ backgroundColor: Colors.primary }}
            >
              <Text className="text-xs text-center opacity-80" style={{ color: Colors.darkGold }}>
                {t('registration.alreadyRegistered')}
              </Text>
            </View>
          )}
        </View>
        {/* Form fields */}
        <View className="px-5">
          {FIELDS.map(({ key, labelKey, placeholderKey, required, keyboardType, autoCapitalize }, index) => (
            <View key={key} className="mb-4">
              <Text
                className="text-sm font-semibold mb-1"
                style={{ color: Colors.text.primary }}
              >
                {t(labelKey)}
                {required && (
                  <Text style={{ color: Colors.darkGold }}> *</Text>
                )}
              </Text>
              <TextInput
                ref={(r) => { inputRefs.current[key] = r; }}
                value={form[key]}
                onChangeText={(v) => updateField(key, v)}
                placeholder={t(placeholderKey)}
                placeholderTextColor="rgba(255,255,255,0.35)"
                keyboardType={keyboardType || 'default'}
                autoCapitalize={autoCapitalize || 'sentences'}
                returnKeyType={index < FIELDS.length - 1 ? 'next' : 'done'}
                onSubmitEditing={() => {
                  const next = FIELDS[index + 1];
                  if (next) inputRefs.current[next.key]?.focus();
                }}
                className="rounded-xl px-4 py-3.5 text-white text-sm"
                style={{
                  backgroundColor: Colors.primary,
                  color: Colors.text.primary,
                  borderWidth: errors[key] ? 1 : 0,
                  borderColor: errors[key] ? '#e53e3e' : 'transparent',
                }}
              />
              {errors[key] && (
                <Text className="text-xs mt-1" style={{ color: '#e53e3e' }}>
                  {errors[key]}
                </Text>
              )}
            </View>
          ))}
        </View>
        {/* Signature note */}
        <View className="px-5 mb-6">
          <Text className="text-xs opacity-50" style={{ color: Colors.text.primary }}>
            By typing your full name in the Signature field above, you are legally signing this registration form.
          </Text>
        </View>
        {/* Submit button */}
        <View className="px-5">
          <Pressable
            onPress={handleSubmit}
            disabled={isSaving}
            className="py-4 rounded-xl items-center"
            style={{
              backgroundColor: isSaving ? 'rgba(188,144,69,0.5)' : Colors.darkGold,
            }}
          >
            {isSaving ? (
              <Text className="text-white font-bold text-base">{t('registration.saving')}</Text>
            ) : (
              <Text className="text-white font-bold text-base">{t('registration.submit')}</Text>
            )}
          </Pressable>
        </View>
        {/* Regenerate PDF (only if previously registered) */}
        {existingRegistration && (
          <View className="px-5 mt-4">
            <Pressable
              onPress={handleRegeneratePdf}
              className="flex-row items-center justify-center py-3 rounded-xl gap-2"
              style={{ backgroundColor: Colors.primary }}
            >
              <RefreshCw size={16} color={Colors.darkGold} />
              <Text className="text-sm font-semibold" style={{ color: Colors.darkGold }}>
                {t('registration.regeneratePdf')}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}