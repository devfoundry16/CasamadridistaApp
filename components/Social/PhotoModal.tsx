import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';

/** A message photo, full screen. The URL is short-lived and never cached to disk. */
export default function PhotoModal({ uri, onClose }: { uri: string | null; onClose: () => void }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: Colors.background.dark }}>
        {uri ? <Image source={{ uri }} style={{ flex: 1 }} contentFit="contain" cachePolicy="memory" /> : null}
        <Touchable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          hitSlop={12}
          style={{ position: 'absolute', top: insets.top + 12, end: 16, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(42,42,42,0.85)' }}
        >
          <X size={20} color={Colors.text.primary} />
        </Touchable>
      </View>
    </Modal>
  );
}
