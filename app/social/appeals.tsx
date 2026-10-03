import { Stack } from 'expo-router';
import { Scale } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, TextInput, View } from 'react-native';

import SocialButton from '@/components/Social/SocialButton';
import T from '@/components/Social/T';
import EmptyState from '@/components/Team/EmptyState';
import Colors from '@/constants/colors';
import { useFileAppeal, useMyAppeals, useMyWarnings } from '@/hooks/social/useAppeals';
import type { MyAppeal } from '@/types/social';
import { appealStatusKey, canAppealRestriction, canAppealWarning, statementProblem, STATEMENT_MAX } from '@/utils/appeals.core';

type Target = { kind: MyAppeal['subject_kind']; id: string | null } | null;

/**
 * Appeals and warnings (admin §25). Reachable while restricted — that is who
 * needs it — from the account tab and from the push a warning or a decision
 * sends. Someone other than whoever took the action reviews each appeal.
 */
export default function AppealsScreen() {
  const { t } = useTranslation();
  const appeals = useMyAppeals();
  const warnings = useMyWarnings();
  const file = useFileAppeal();
  const [target, setTarget] = useState<Target>(null);
  const [statement, setStatement] = useState('');

  const list = appeals.data?.data ?? [];
  const restricted = appeals.data?.restricted ?? false;
  const restrictionAppealable = appeals.data?.restrictionAppealable ?? false;

  function submit() {
    if (!target) return;
    const problem = statementProblem(statement);
    if (problem) {
      Alert.alert(t('appeals.title'), t(problem === 'short' ? 'appeals.tooShort' : 'appeals.tooLong'));
      return;
    }
    file.mutate(
      { subject_kind: target.kind, subject_id: target.id, statement: statement.trim() },
      {
        onSuccess: () => {
          setTarget(null);
          setStatement('');
          Alert.alert(t('appeals.title'), t('appeals.sent'));
        },
        onError: () => Alert.alert(t('appeals.title'), t('appeals.failed')),
      }
    );
  }

  const form = target ? (
    <View style={{ gap: 10, padding: 16, borderRadius: 16, backgroundColor: Colors.background.light }}>
      <T weight="semibold">{t(target.kind === 'restriction' ? 'appeals.formRestriction' : 'appeals.formWarning')}</T>
      <TextInput
        value={statement}
        onChangeText={setStatement}
        multiline
        maxLength={STATEMENT_MAX}
        placeholder={t('appeals.placeholder')}
        placeholderTextColor={Colors.text.tertiary}
        style={{ minHeight: 110, color: Colors.text.primary, textAlignVertical: 'top', padding: 12, borderRadius: 12, backgroundColor: Colors.background.dark }}
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <SocialButton label={t('appeals.send')} busy={file.isPending} onPress={submit} flex />
        <SocialButton label={t('common.cancel')} tone="outline" onPress={() => setTarget(null)} flex />
      </View>
    </View>
  ) : null;

  if (appeals.isLoading || warnings.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background.medium }}>
        <Stack.Screen options={{ title: t('appeals.title') }} />
        <ActivityIndicator color={Colors.darkGold} style={{ marginTop: 40 }} />
      </View>
    );
  }

  const warningRows = warnings.data ?? [];
  const nothing = !restricted && warningRows.length === 0 && list.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.medium }}>
      <Stack.Screen options={{ title: t('appeals.title') }} />
      {nothing ? (
        <EmptyState icon={Scale} title={t('appeals.emptyTitle')} body={t('appeals.emptyBody')} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          {restricted ? (
            <View style={{ gap: 8, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.status.error }}>
              <T weight="semibold">{t('appeals.restrictedTitle')}</T>
              <T color={Colors.text.secondary}>{t('appeals.restrictedBody')}</T>
              {canAppealRestriction(restrictionAppealable, list) && target?.kind !== 'restriction' ? (
                <SocialButton label={t('appeals.appealRestriction')} onPress={() => setTarget({ kind: 'restriction', id: null })} />
              ) : null}
            </View>
          ) : null}
          {target?.kind === 'restriction' ? form : null}

          {warningRows.length ? (
            <View style={{ gap: 8 }}>
              <T step="title" weight="bold">{t('appeals.warnings')}</T>
              {warningRows.map((w) => (
                <View key={w.id} style={{ gap: 6, padding: 14, borderRadius: 14, backgroundColor: Colors.background.light }}>
                  <T>{w.reason}</T>
                  <T step="caption" color={Colors.text.tertiary} ltr>{new Date(w.created_at).toLocaleDateString()}</T>
                  {w.withdrawn_at ? (
                    <T step="caption" color={Colors.text.secondary}>{t('appeals.withdrawn')}</T>
                  ) : canAppealWarning(w, list) && !(target?.kind === 'warning' && target.id === w.id) ? (
                    <SocialButton label={t('appeals.appealWarning')} tone="outline" onPress={() => setTarget({ kind: 'warning', id: w.id })} />
                  ) : null}
                  {target?.kind === 'warning' && target.id === w.id ? form : null}
                </View>
              ))}
            </View>
          ) : null}

          {list.length ? (
            <View style={{ gap: 8 }}>
              <T step="title" weight="bold">{t('appeals.yourAppeals')}</T>
              {list.map((a) => (
                <View key={a.id} style={{ gap: 4, padding: 14, borderRadius: 14, backgroundColor: Colors.background.light }}>
                  <T weight="semibold">{t(`appeals.subject.${a.subject_kind}`)}</T>
                  <T color={a.status === 'overturned' ? Colors.status.success : Colors.text.secondary}>{t(appealStatusKey(a.status))}</T>
                  {a.decision_note && a.status === 'upheld' ? <T step="caption" color={Colors.text.tertiary}>{a.decision_note}</T> : null}
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
