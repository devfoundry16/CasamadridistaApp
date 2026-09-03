import { Image } from 'expo-image';
import { BarChart3, Film, Images, Image as ImageIcon, Radio } from 'lucide-react-native';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import type { ContributorItem } from '@/types/media/contributor';
import StatusBadge from './StatusBadge';
import { itemThumbnail, matchLabel } from './labels';

interface Props {
  item: ContributorItem;
  onPress: (item: ContributorItem) => void;
  onStats?: (item: ContributorItem) => void;
}

const THUMB_W = 84;
const THUMB_H = 47; // 16:9

/** Only the four types the app can create have a label; `update`, `live`,
 *  `audio` and `interview` are desk formats created in the admin. */
const LABELLED_TYPES = new Set(['photo', 'video', 'gallery', 'story']);

function TypeIcon({ type }: { type: string }) {
  const size = 16;
  const color = Colors.text.tertiary;
  if (type === 'video') return <Film size={size} color={color} />;
  if (type === 'gallery') return <Images size={size} color={color} />;
  if (type === 'story') return <Radio size={size} color={color} />;
  return <ImageIcon size={size} color={color} />;
}

/**
 * One row of "My content".
 *
 * The stats button is only offered for a published item: `GET …/items/:id/stats`
 * reads `media_daily_stats`, which has nothing at all to say about a draft, and
 * a screen of zeroes reads as broken rather than as "not yet published".
 */
function MyContentRow({ item, onPress, onStats }: Props) {
  const { t } = useTranslation();
  const thumb = itemThumbnail(item);

  return (
    <Touchable
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={
        item.title ?? (LABELLED_TYPES.has(item.type) ? t(`contributor.type.${item.type}`) : item.type)
      }
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View
        style={{
          width: THUMB_W,
          height: THUMB_H,
          borderRadius: 6,
          overflow: 'hidden',
          backgroundColor: Colors.background.light,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {thumb ? (
          <Image
            source={{ uri: thumb }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            placeholder={item.cover_blurhash ? { blurhash: item.cover_blurhash } : undefined}
            transition={120}
          />
        ) : (
          <TypeIcon type={item.type} />
        )}
      </View>

      <View className="flex-1">
        <Text
          className="text-[14px] font-semibold"
          numberOfLines={1}
          style={{ color: Colors.text.primary }}
        >
          {item.title || t('contributor.myContent.untitled')}
        </Text>
        <Text className="text-[12px] mt-0.5" numberOfLines={1} style={{ color: Colors.text.tertiary }}>
          {matchLabel(item.match, t('contributor.myContent.noMatch'))}
        </Text>
        <View className="flex-row items-center gap-2 mt-1.5">
          <StatusBadge status={String(item.status)} compact />
          <Text
            className="text-[11px]"
            style={{ color: Colors.text.muted, writingDirection: 'ltr' }}
          >
            {/* `value`, not `count`: i18next's plural resolution would need six
                suffixed keys per string in Arabic (Milestone D, assumption 6). */}
            {t('contributor.myContent.assetCount', { value: item.asset_count ?? 0 })}
          </Text>
        </View>
      </View>

      {onStats && item.status === 'published' ? (
        <Touchable
          onPress={() => onStats(item)}
          accessibilityRole="button"
          accessibilityLabel={t('contributor.stats.title')}
          hitSlop={8}
          style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.6 : 1 })}
        >
          <BarChart3 size={18} color={Colors.darkGold} />
        </Touchable>
      ) : null}
    </Touchable>
  );
}

export default memo(MyContentRow);
