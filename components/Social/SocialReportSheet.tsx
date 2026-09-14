import { Check, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Modal, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { typeStyle } from '@/constants/type';
import { useFont } from '@/contexts/FontContext';
import SocialService from '@/services/SocialService';
import { SOCIAL_REPORT_REASONS, type SocialReportReason } from '@/types/social';
import T from './T';

interface Props {
  visible: boolean;
  target: { kind: 'message' | 'profile'; id: string } | null;
  onClose: () => void;
  /** Offered after a successful report — reporting and blocking are separate choices. */
  onBlock?: () => void;
}

/** Report a message or a profile with §23's reasons, verbatim. */
export default function SocialReportSheet({ visible, target, onClose, onBlock }: Props) {
  const { t } = useTranslation();
  const { isArabic } = useFont();
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<SocialReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);

  const close = () => {
    setReason(null);
    setDetails('');
    onClose();
  };

  const submit = async () => {
    if (!target || !reason) return;
    if (reason === 'other' && !details.trim()) {
      Alert.alert(t('social.report.detailsRequiredTitle'), t('social.report.detailsRequiredBody'));
      return;
    }
    setBusy(true);
    try {
      await SocialService.report({ target_kind: target.kind, target_id: target.id, reason, ...(details.trim() ? { details: details.trim() } : {}) });
      close();
      setTimeout(() => {
        Alert.alert(t('social.report.doneTitle'), t('social.report.doneBody'), [
          ...(onBlock ? [{ text: t('social.actions.block'), style: 'destructive' as const, onPress: onBlock }] : []),
          { text: t('common.confirm') },
        ]);
      }, 320);
    } catch {
      Alert.alert(t('common.error'), t('social.errors.generic'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <T step="headline" weight="bold" style={{ flex: 1 }}>
            {target?.kind === 'profile' ? t('social.report.titleProfile') : t('social.report.titleMessage')}
          </T>
          <Touchable onPress={close} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('common.cancel')}>
            <X size={22} color={Colors.text.tertiary} />
          </Touchable>
        </View>
        <T step="footnote" color={Colors.text.tertiary} style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          {t('social.report.privacy')}
        </T>
        <ScrollView keyboardShouldPersistTaps="handled">
          {SOCIAL_REPORT_REASONS.map((key) => {
            const on = reason === key;
            return (
              <Touchable
                key={key}
                onPress={() => setReason(key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: Colors.border.default, backgroundColor: pressed ? Colors.background.card : 'transparent' })}
              >
                <View style={{ flex: 1 }}>
                  <T step="body" weight="semibold">
                    {t(`social.report.reasons.${key}`)}
                  </T>
                  <T step="caption" color={Colors.text.tertiary}>
                    {t(`social.report.reasonHints.${key}`)}
                  </T>
                </View>
                {on ? <Check size={18} color={Colors.darkGold} /> : null}
              </Touchable>
            );
          })}
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder={t('social.report.detailsPlaceholder')}
            placeholderTextColor={Colors.text.muted}
            multiline
            maxLength={500}
            accessibilityLabel={t('social.report.detailsPlaceholder')}
            style={{ ...typeStyle('body', isArabic), color: Colors.text.primary, margin: 16, minHeight: 88, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border.default, backgroundColor: Colors.background.medium, textAlignVertical: 'top' }}
          />
        </ScrollView>
        <View style={{ padding: 16, paddingBottom: insets.bottom + 16, borderTopWidth: 1, borderColor: Colors.border.default }}>
          <Touchable
            onPress={submit}
            disabled={!reason || busy}
            accessibilityRole="button"
            style={({ pressed }) => ({ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: reason ? Colors.darkGold : Colors.background.medium, opacity: pressed ? 0.8 : 1 })}
          >
            {busy ? (
              <ActivityIndicator color={Colors.text.dark} />
            ) : (
              <T step="body" weight="bold" color={reason ? Colors.text.dark : Colors.text.muted}>
                {t('social.report.submit')}
              </T>
            )}
          </Touchable>
        </View>
      </View>
    </Modal>
  );
}
