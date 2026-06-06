import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import ReportService, { type ReportReason } from '@/services/ReportService';
import Colors from '@/constants/colors';

interface Props {
  visible: boolean;
  postId?: string;
  commentId?: string;
  onClose: () => void;
}

export default function ReportSheet({ visible, postId, commentId, onClose }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected]       = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const REASONS: { key: ReportReason; label: string; description: string }[] = [
    { key: 'spam',           label: t('community.reasonSpam'),            description: t('community.reasonSpamDesc')            },
    { key: 'nudity',         label: t('community.reasonNudity'),          description: t('community.reasonNudityDesc')          },
    { key: 'violence',       label: t('community.reasonViolence'),        description: t('community.reasonViolenceDesc')        },
    { key: 'hate',           label: t('community.reasonHate'),            description: t('community.reasonHateDesc')            },
    { key: 'misinformation', label: t('community.reasonMisinformation'),  description: t('community.reasonMisinformationDesc')  },
    { key: 'other',          label: t('community.reasonOther'),           description: t('community.reasonOtherDesc')           },
  ];

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      if (postId) {
        await ReportService.reportPost(postId, selected, description.trim() || undefined);
      } else if (commentId) {
        await ReportService.reportComment(commentId, selected, description.trim() || undefined);
      }
      Alert.alert(t('community.reportedTitle'), t('community.reportedMessage'));
      setSelected(null);
      setDescription('');
      onClose();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message ?? t('community.reportFailed'));
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
            <Text className="text-lg font-bold" style={{ color: Colors.text.primary }}>{t('community.reportContent')}</Text>
            <TouchableOpacity onPress={onClose} disabled={submitting}>
              <X size={22} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <Text className="px-4 mb-3 text-sm" style={{ color: Colors.text.secondary }}>
              {t('community.reportWhy')}
            </Text>

            {REASONS.map((r) => {
              const isSelected = selected === r.key;
              return (
                <TouchableOpacity
                  key={r.key}
                  onPress={() => setSelected(r.key)}
                  className="flex-row items-center px-4 py-3 border-b"
                  style={{ borderColor: Colors.border.default }}
                  activeOpacity={0.7}
                >
                  <View
                    className="w-5 h-5 rounded-full border-2 mr-3 items-center justify-center"
                    style={{
                      borderColor: isSelected ? Colors.darkGold : Colors.text.tertiary,
                      backgroundColor: isSelected ? Colors.darkGold : 'transparent',
                    }}
                  >
                    {isSelected && <View className="w-2 h-2 rounded-full bg-white" />}
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-sm" style={{ color: Colors.text.primary }}>{r.label}</Text>
                    <Text className="text-xs" style={{ color: Colors.text.tertiary }}>{r.description}</Text>
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
                style={{ backgroundColor: Colors.background.medium, color: Colors.text.primary, minHeight: 80 }}
              />
            )}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!selected || submitting}
              className="mx-4 mt-5 rounded-xl py-3 items-center"
              style={{ backgroundColor: selected ? Colors.darkGold : Colors.background.medium }}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-bold text-sm" style={{ color: selected ? Colors.textWhite : Colors.text.tertiary }}>
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
