import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { Ban, Check, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, I18nManager, KeyboardAvoidingView, Platform, ScrollView, Switch, TextInput, View } from 'react-native';

import Avatar from '@/components/Social/Avatar';
import T from '@/components/Social/T';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { typeStyle } from '@/constants/type';
import { useFont } from '@/contexts/FontContext';
import { socialKeys } from '@/hooks/social/keys';
import { useDebounced } from '@/hooks/social/useFriends';
import { useMyProfile } from '@/hooks/social/useProfile';
import { useKeyboardOffsets } from '@/hooks/useKeyboardOffsets';
import SocialService, { SocialApiError } from '@/services/SocialService';

const BIO_MAX = 160;
const NAME_MAX = 40;

/**
 * Edit profile — display name, @username, bio, and the activity switch (§1, §18).
 *
 * The username field checks availability as you type (debounced) and offers
 * free suggestions built from the account's name, so claiming one is a tap.
 * The server re-checks everything on save; this screen only makes the answer
 * arrive before the Save button does.
 */
export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isArabic } = useFont();
  const queryClient = useQueryClient();
  const { keyboardVerticalOffset } = useKeyboardOffsets();
  const { data: me, isLoading } = useMyProfile();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [showActivity, setShowActivity] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!me || seeded) return;
    setDisplayName(me.user.display_name ?? '');
    setUsername(me.user.username ?? '');
    setBio(me.user.bio ?? '');
    setShowActivity(me.user.show_activity !== false);
    setSeeded(true);
  }, [me, seeded]);

  const candidate = useDebounced(username.trim().replace(/^@+/, '').toLowerCase(), 350);
  const changedHandle = !!candidate && candidate !== (me?.user.username ?? '');
  const check = useQuery({
    queryKey: socialKeys.username(candidate),
    queryFn: () => SocialService.checkUsername(candidate),
    enabled: changedHandle,
    staleTime: 10_000,
  });
  const suggestions = useQuery({
    queryKey: socialKeys.username(''),
    queryFn: () => SocialService.checkUsername(),
    enabled: seeded && !me?.user.username,
  });

  const handleProblem = changedHandle && check.data && check.data.available === false ? check.data.reason ?? 'taken' : null;

  const save = async () => {
    if (!me) return;
    const patch: Parameters<typeof SocialService.updateMe>[0] = {};
    if (displayName.trim() !== (me.user.display_name ?? '')) patch.display_name = displayName.trim() || null;
    if (bio.trim() !== (me.user.bio ?? '')) patch.bio = bio.trim() || null;
    if (showActivity !== (me.user.show_activity !== false)) patch.show_activity = showActivity;
    if (changedHandle) patch.username = candidate;
    if (!Object.keys(patch).length) {
      router.back();
      return;
    }
    setSaving(true);
    try {
      const updated = await SocialService.updateMe(patch);
      queryClient.setQueryData(socialKeys.me(), updated);
      if (updated) queryClient.setQueryData(socialKeys.profile(updated.user.id), updated);
      router.back();
    } catch (error) {
      const code = error instanceof SocialApiError ? error.code : 'network_error';
      Alert.alert(t('common.error'), t(`social.username.${code}`, { defaultValue: t(`social.errors.${code}`, { defaultValue: t('social.errors.generic') }) }));
    } finally {
      setSaving(false);
    }
  };

  const input = {
    ...typeStyle('body', isArabic),
    color: Colors.text.primary,
    backgroundColor: Colors.background.medium,
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: I18nManager.isRTL ? ('right' as const) : ('left' as const),
  };

  const Chevron = I18nManager.isRTL ? ChevronLeft : ChevronRight;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.background.medium }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={keyboardVerticalOffset}>
      <Stack.Screen
        options={{
          title: t('social.edit.title'),
          headerRight: () => (
            <Touchable onPress={save} disabled={saving || !!handleProblem} accessibilityRole="button" hitSlop={8} style={{ paddingHorizontal: 8, opacity: saving || handleProblem ? 0.5 : 1 }}>
              {saving ? <ActivityIndicator color={Colors.text.primary} /> : <T step="body" weight="bold">{t('common.save')}</T>}
            </Touchable>
          ),
        }}
      />
      {isLoading || !me ? (
        <ActivityIndicator color={Colors.darkGold} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <Avatar uri={me.user.avatar_url} name={displayName || me.user.name} size={56} />
            <T step="footnote" color={Colors.text.tertiary} style={{ flex: 1, marginStart: 12 }}>
              {t('social.edit.photoHint')}
            </T>
          </View>

          <Label text={t('social.edit.displayName')} />
          <TextInput value={displayName} onChangeText={setDisplayName} maxLength={NAME_MAX} placeholder={me.user.name} placeholderTextColor={Colors.text.muted} style={input} accessibilityLabel={t('social.edit.displayName')} />

          <Label text={t('social.edit.username')} />
          <View style={{ flexDirection: 'row', alignItems: 'center', ...input, paddingVertical: 0 }}>
            <T step="body" color={Colors.text.muted} ltr>
              @
            </T>
            <TextInput
              value={username}
              onChangeText={(v) => setUsername(v.replace(/\s/g, ''))}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={21}
              placeholder="madridista"
              placeholderTextColor={Colors.text.muted}
              style={{ ...typeStyle('body', isArabic), color: Colors.text.primary, flex: 1, paddingVertical: 10, marginStart: 2, writingDirection: 'ltr', textAlign: 'left' }}
              accessibilityLabel={t('social.edit.username')}
            />
            {changedHandle ? (
              check.isFetching ? (
                <ActivityIndicator size="small" color={Colors.text.tertiary} />
              ) : check.data?.available ? (
                <Check size={18} color={Colors.status.success} />
              ) : check.data ? (
                <X size={18} color={Colors.status.error} />
              ) : null
            ) : null}
          </View>
          <T step="caption" color={handleProblem ? Colors.status.error : Colors.text.tertiary} style={{ marginTop: 6 }}>
            {handleProblem ? t(`social.username.${handleProblem}`, { defaultValue: t('social.username.invalid_characters') }) : t('social.edit.usernameHint')}
          </T>
          {!me.user.username && suggestions.data?.suggestions?.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {suggestions.data.suggestions.map((s) => (
                <Touchable key={s} onPress={() => setUsername(s)} accessibilityRole="button" style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: username === s ? Colors.darkGold : Colors.border.light, opacity: pressed ? 0.7 : 1 })}>
                  <T step="footnote" color={username === s ? Colors.darkGold : Colors.text.secondary} ltr>
                    @{s}
                  </T>
                </Touchable>
              ))}
            </View>
          ) : null}

          <Label text={t('social.edit.bio')} />
          <TextInput value={bio} onChangeText={setBio} maxLength={BIO_MAX} multiline placeholder={t('social.edit.bioPlaceholder')} placeholderTextColor={Colors.text.muted} style={{ ...input, minHeight: 88, textAlignVertical: 'top' }} accessibilityLabel={t('social.edit.bio')} />
          <T step="caption" color={Colors.text.muted} ltr style={{ marginTop: 4, alignSelf: 'flex-end' }}>
            {Array.from(bio).length}/{BIO_MAX}
          </T>

          <View style={{ marginTop: 24, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border.default }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}>
              <View style={{ flex: 1, marginEnd: 12 }}>
                <T step="body" weight="semibold">
                  {t('social.edit.showActivity')}
                </T>
                <T step="caption" color={Colors.text.tertiary} style={{ marginTop: 2 }}>
                  {t('social.edit.showActivityHint')}
                </T>
              </View>
              <Switch value={showActivity} onValueChange={setShowActivity} trackColor={{ true: Colors.darkGold, false: Colors.background.light }} thumbColor={Colors.text.primary} accessibilityLabel={t('social.edit.showActivity')} />
            </View>
            <Touchable onPress={() => router.push('/social/blocked')} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderColor: Colors.border.default, opacity: pressed ? 0.7 : 1 })}>
              <Ban size={18} color={Colors.text.tertiary} />
              <T step="body" style={{ flex: 1, marginStart: 10 }}>
                {t('social.blocked.title')}
              </T>
              <Chevron size={18} color={Colors.text.muted} />
            </Touchable>
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

function Label({ text }: { text: string }) {
  return (
    <T step="footnote" weight="semibold" color={Colors.text.secondary} style={{ marginTop: 16, marginBottom: 6 }}>
      {text}
    </T>
  );
}
