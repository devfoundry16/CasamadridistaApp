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
import ReportService, { type PostReportReason } from '@/services/ReportService';
import Colors from '@/constants/colors';
import { POST_REPORT_REASONS, reportReady } from '@/utils/post.core';

interface Props {
  visible: boolean;
  /** Pass exactly one: the post, or the comment. */
  postId?: string;
  commentId?: string;
  onClose: () => void;
}

/**
 * Report a post or a comment with the eight social reasons — the same list,
 * labels and hints as `SocialReportSheet` for messages and profiles. "Something
 * else" needs a description.
 */
export default function ReportSheet({ visible, postId, commentId, onClose }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected]       = useState<PostReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const REASONS = POST_REPORT_REASONS.map((key) => ({
    key,
    label: t(`social.report.reasons.${key}`),
    description: t(`social.report.reasonHints.${key}`),
  }));

  const ready = reportReady(selected, description);

  const close = () => {
    setSelected(null);
    setDescription('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!selected || !ready) return;
    setSubmitting(true);
    try {
      if (postId) {
        await ReportService.reportPost(postId, selected, description.trim() || undefined);
      } else if (commentId) {
        await ReportService.reportComment(commentId, selected, description.trim() || undefined);
      }
      Alert.alert(t('community.reportedTitle'), t('community.reportedMessage'));
      close();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message ?? t('community.reportFailed'));
      // Nothing to change and resend: it is already with the moderators.
      if (err?.code === 'already_reported') close();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen" onRequestClose={close}>
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View
          className="rounded-t-2xl pt-4 pb-10"
          style={{ backgroundColor: Colors.background.deepDark, maxHeight: '80%' }}
        >
          <View className="flex-row items-center justify-between px-4 mb-4">
            <Text className="text-lg font-bold" style={{ color: Colors.text.primary }}>
              {commentId && !postId ? t('community.reportComment') : t('community.reportContent')}
            </Text>
            <TouchableOpacity onPress={close} disabled={submitting} accessibilityRole="button" accessibilityLabel={t('common.cancel')}>
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
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
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
                placeholder={t('community.reportDescribeRequired')}
                accessibilityLabel={t('community.reportDescribeRequired')}
                placeholderTextColor={Colors.text.muted}
                multiline
                maxLength={500}
                className="mx-4 mt-3 rounded-xl px-4 py-3 text-sm"
                style={{ backgroundColor: Colors.background.medium, color: Colors.text.primary, minHeight: 80 }}
              />
            )}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!ready || submitting}
              className="mx-4 mt-5 rounded-xl py-3 items-center"
              style={{ backgroundColor: ready ? Colors.darkGold : Colors.background.medium }}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-bold text-sm" style={{ color: ready ? Colors.text.dark : Colors.text.tertiary }}>
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
