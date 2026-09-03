import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Text } from '@/components/Text';
import Colors from '@/constants/colors';
import CasaMediaService from '@/services/CasaMediaService';
import type { ReportReason } from '@/services/ReportService';

interface Props {
  visible: boolean;
  itemId: string;
  onClose: () => void;
}

/**
 * Report a Casa Media item.
 *
 * Structurally identical to `Community/Moderation/ReportSheet` (same reasons,
 * same copy, same modal shape) but posting to `/casa-media/items/:id/report`,
 * because `media_reports` is a separate table from `post_reports`.
 */
export default function MediaReportSheet({ visible, itemId, onClose }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const REASONS: { key: ReportReason; label: string; description: string }[] = [
    { key: 'spam', label: t('community.reasonSpam'), description: t('community.reasonSpamDesc') },
    { key: 'nudity', label: t('community.reasonNudity'), description: t('community.reasonNudityDesc') },
    { key: 'violence', label: t('community.reasonViolence'), description: t('community.reasonViolenceDesc') },
    { key: 'hate', label: t('community.reasonHate'), description: t('community.reasonHateDesc') },
    { key: 'misinformation', label: t('community.reasonMisinformation'), description: t('community.reasonMisinformationDesc') },
    { key: 'other', label: t('community.reasonOther'), description: t('community.reasonOtherDesc') },
  ];

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await CasaMediaService.report(itemId, selected, description.trim() || undefined);
      Alert.alert(t('community.reportedTitle'), t('community.reportedMessage'));
      setSelected(null);
      setDescription('');
      onClose();
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message ?? t('community.reportFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View
          className="rounded-t-2xl pt-4 pb-10"
          style={{ backgroundColor: Colors.background.deepDark, maxHeight: '80%' }}
        >
          <View className="flex-row items-center justify-between px-4 mb-4">
            <Text className="text-lg font-bold" style={{ color: Colors.text.primary }}>
              {t('community.reportContent')}
            </Text>
            <TouchableOpacity onPress={onClose} disabled={submitting} accessibilityRole="button">
              <X size={22} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <Text className="px-4 mb-3 text-sm" style={{ color: Colors.text.secondary }}>
              {t('community.reportWhy')}
            </Text>

            {REASONS.map((reason) => {
              const isSelected = selected === reason.key;
              return (
                <TouchableOpacity
                  key={reason.key}
                  onPress={() => setSelected(reason.key)}
                  className="flex-row items-center px-4 py-3 border-b"
                  style={{ borderColor: Colors.border.default }}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                >
                  <View
                    className="w-5 h-5 rounded-full border-2 items-center justify-center"
                    style={{
                      marginEnd: 12,
                      borderColor: isSelected ? Colors.darkGold : Colors.text.tertiary,
                      backgroundColor: isSelected ? Colors.darkGold : 'transparent',
                    }}
                  >
                    {isSelected && <View className="w-2 h-2 rounded-full bg-white" />}
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-sm" style={{ color: Colors.text.primary }}>
                      {reason.label}
                    </Text>
                    <Text className="text-xs" style={{ color: Colors.text.tertiary }}>
                      {reason.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {selected === 'other' && (
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder={t('community.reportDescribePlaceholder')}
                placeholderTextColor={Colors.text.muted}
                multiline
                maxLength={500}
                className="mx-4 mt-3 rounded-xl px-4 py-3 text-sm"
                style={{
                  backgroundColor: Colors.background.medium,
                  color: Colors.text.primary,
                  minHeight: 80,
                }}
              />
            )}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!selected || submitting}
              className="mx-4 mt-5 rounded-xl py-3 items-center"
              style={{ backgroundColor: selected ? Colors.darkGold : Colors.background.medium }}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  className="font-bold text-sm"
                  style={{ color: selected ? Colors.text.dark : Colors.text.tertiary }}
                >
                  {t('community.reportSubmit')}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
