import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import UploadProgressList from '@/components/Contributor/UploadProgressList';
import { Text } from '@/components/Text';
import Colors from '@/constants/colors';
import { useUploadQueue } from '@/hooks/media/useUploadQueue';

/**
 * The upload manager, as a screen.
 *
 * Not gated by `ContributorGate`: the queue is local state about files already
 * on this device, and a contributor whose grant is suspended mid-upload still
 * needs to see (and cancel) what is in flight. Every row's server call is
 * authenticated on its own anyway.
 */
export default function UploadsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const entries = useUploadQueue();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background.dark }}
      contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24, flexGrow: 1 }}
    >
      <View className="px-4 pb-3">
        <Text className="text-[12px]" style={{ color: Colors.text.tertiary }}>
          {t('contributor.uploads.explainer')}
        </Text>
      </View>
      <UploadProgressList entries={entries} showEmpty />
    </ScrollView>
  );
}
