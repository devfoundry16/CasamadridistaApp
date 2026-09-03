import { Image } from 'expo-image';
import { AlertTriangle, Check, RotateCw, Video, X } from 'lucide-react-native';
import React, { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import UploadManager from '@/services/upload/UploadManager';
import { MAX_ATTEMPTS, type UploadEntry } from '@/services/upload/uploadPolicy.core';
import { formatBytes } from './labels';

interface Props {
  entry: UploadEntry;
  onCancel?: (entry: UploadEntry) => void;
}

const THUMB = 44;

/**
 * One queue row: thumbnail, state, a determinate bar and the two actions that
 * matter (retry, cancel).
 *
 * The bar is a plain `View` with a percentage width rather than a progress
 * component — it is repainted several times a second and must not allocate.
 */
function UploadRow({ entry, onCancel }: Props) {
  const { t } = useTranslation();

  const retry = useCallback(() => UploadManager.retry(entry.id), [entry.id]);
  const cancel = useCallback(() => {
    if (onCancel) onCancel(entry);
    else void UploadManager.cancel(entry.id);
  }, [entry, onCancel]);

  const statusText = t(`contributor.uploads.status.${entry.status}`);
  const failed = entry.status === 'failed';
  const done = entry.status === 'ready';
  const waitingRetry =
    (entry.status === 'queued' || entry.status === 'uploaded') && entry.attempts > 0;

  const percent = Math.round(entry.progress * 100);

  return (
    <View
      className="flex-row items-center gap-3 px-4 py-3"
      style={{ borderBottomWidth: 1, borderBottomColor: Colors.border.default }}
    >
      <View
        style={{
          width: THUMB,
          height: THUMB,
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: Colors.background.light,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {entry.kind === 'image' ? (
          <Image
            source={{ uri: entry.localUri }}
            style={{ width: THUMB, height: THUMB }}
            contentFit="cover"
            transition={0}
          />
        ) : (
          <Video size={18} color={Colors.text.tertiary} />
        )}
      </View>

      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text
            className="text-[13px] font-semibold flex-1"
            numberOfLines={1}
            style={{ color: failed ? Colors.status.error : Colors.text.primary }}
          >
            {waitingRetry ? t('contributor.uploads.waitingRetry') : statusText}
          </Text>
          {/* Digits pinned LTR: "2/3" reverses next to Arabic otherwise. */}
          {entry.attempts > 0 && !done ? (
            <Text
              className="text-[11px]"
              style={{ color: Colors.text.muted, writingDirection: 'ltr' }}
            >
              {`${entry.attempts}/${MAX_ATTEMPTS}`}
            </Text>
          ) : null}
        </View>

        {failed && entry.error ? (
          <Text className="text-[11px] mt-0.5" numberOfLines={2} style={{ color: Colors.text.tertiary }}>
            {entry.error}
          </Text>
        ) : (
          <View
            style={{
              height: 4,
              borderRadius: 2,
              backgroundColor: Colors.background.light,
              marginTop: 6,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${done ? 100 : percent}%`,
                height: '100%',
                backgroundColor: done ? Colors.status.success : Colors.darkGold,
              }}
            />
          </View>
        )}

        {formatBytes(entry.sizeBytes) ? (
          <Text
            className="text-[11px] mt-1"
            style={{ color: Colors.text.muted, writingDirection: 'ltr' }}
          >
            {formatBytes(entry.sizeBytes)}
          </Text>
        ) : null}
      </View>

      {done ? (
        <Check size={18} color={Colors.status.success} />
      ) : failed ? (
        <View className="flex-row items-center gap-1">
          <Touchable
            onPress={retry}
            accessibilityRole="button"
            accessibilityLabel={t('contributor.uploads.retry')}
            hitSlop={8}
            style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.6 : 1 })}
          >
            <RotateCw size={18} color={Colors.darkGold} />
          </Touchable>
          <Touchable
            onPress={cancel}
            accessibilityRole="button"
            accessibilityLabel={t('contributor.uploads.cancel')}
            hitSlop={8}
            style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.6 : 1 })}
          >
            <X size={18} color={Colors.text.tertiary} />
          </Touchable>
        </View>
      ) : waitingRetry ? (
        <AlertTriangle size={18} color={Colors.status.warning} />
      ) : (
        <Touchable
          onPress={cancel}
          accessibilityRole="button"
          accessibilityLabel={t('contributor.uploads.cancel')}
          hitSlop={8}
          style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.6 : 1 })}
        >
          <X size={18} color={Colors.text.tertiary} />
        </Touchable>
      )}
    </View>
  );
}

export default memo(UploadRow);
