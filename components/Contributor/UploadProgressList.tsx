import { UploadCloud } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import EmptyState from '@/components/Team/EmptyState';
import Colors from '@/constants/colors';
import UploadManager from '@/services/upload/UploadManager';
import { readiness } from '@/services/upload/uploadPolicy.core';
import type { UploadEntry } from '@/services/upload/uploadPolicy.core';
import UploadRow from './UploadRow';

interface Props {
  entries: UploadEntry[];
  /** Renders an empty state instead of nothing when the queue is clear. */
  showEmpty?: boolean;
  header?: React.ReactNode;
}

/**
 * The queue, rendered inline.
 *
 * A plain mapped `View` rather than a `FlatList`: the queue is bounded by
 * `maxGalleryAssets` (20 by default), every row is already `memo`'d, and
 * nesting a virtualised list inside the contributor home's ScrollView is the
 * classic VirtualizedList-inside-ScrollView warning.
 */
export default function UploadProgressList({ entries, showEmpty = false, header }: Props) {
  const { t } = useTranslation();
  const summary = readiness(entries);

  if (!entries.length) {
    if (!showEmpty) return null;
    return (
      <EmptyState
        icon={UploadCloud}
        title={t('contributor.uploads.emptyTitle')}
        body={t('contributor.uploads.emptyBody')}
      />
    );
  }

  return (
    <View>
      {header}

      <View className="flex-row items-center justify-between px-4 pb-2">
        <Text className="text-[12px]" style={{ color: Colors.text.tertiary }}>
          {t('contributor.uploads.summary', {
            ready: summary.ready,
            total: summary.total,
          })}
        </Text>
        <View className="flex-row items-center gap-4">
          {summary.failed > 0 ? (
            <Touchable
              onPress={() => UploadManager.retryAllFailed()}
              accessibilityRole="button"
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text className="text-[12px] font-semibold" style={{ color: Colors.darkGold }}>
                {t('contributor.uploads.retryAll')}
              </Text>
            </Touchable>
          ) : null}
          {summary.ready > 0 ? (
            <Touchable
              onPress={() => void UploadManager.clearFinished()}
              accessibilityRole="button"
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text className="text-[12px]" style={{ color: Colors.text.tertiary }}>
                {t('contributor.uploads.clearFinished')}
              </Text>
            </Touchable>
          ) : null}
        </View>
      </View>

      {entries.map((entry) => (
        <UploadRow key={entry.id} entry={entry} />
      ))}
    </View>
  );
}
