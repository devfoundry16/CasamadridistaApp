import { useRouter } from 'expo-router';
import React, { memo, useCallback } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import type { MediaItem } from '@/types/media/casaMedia';
import LockedOverlay from './LockedOverlay';
import MediaCover from './MediaCover';
import { relativeTime } from './time';

export type MediaCardVariant = 'rail' | 'grid' | 'row';

interface Props {
  item: MediaItem;
  variant?: MediaCardVariant;
  /** Cover width in points. The card sizes itself from this. */
  width: number;
  onPress?: (item: MediaItem) => void;
}

const ASPECT = 9 / 16;

/**
 * The single card recipe for Casa Media, in the three shapes the hub needs.
 *
 * `row` is 1px-bordered like `Team/SurfaceCard`; `rail` and `grid` are bare
 * covers with the caption underneath, because a border on a 16:9 cover in a
 * horizontal rail just reads as visual noise at that density.
 */
function MediaCard({ item, variant = 'rail', width, onPress }: Props) {
  const router = useRouter();

  const open = useCallback(() => {
    if (onPress) {
      onPress(item);
      return;
    }
    router.push(`/media/item/${item.id}`);
  }, [item, onPress, router]);

  if (variant === 'row') {
    const thumbWidth = 116;
    return (
      <Touchable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={item.title ?? undefined}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 10,
          paddingHorizontal: 16,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <View>
          <MediaCover
            item={item}
            width={thumbWidth}
            height={Math.round(thumbWidth * ASPECT)}
            radius={10}
          />
          {item.locked ? <LockedOverlay item={item} variant="card" compact /> : null}
        </View>

        {/* marginStart, not ml-3: the thumbnail owns the leading edge in RTL. */}
        <View style={{ flex: 1, marginStart: 12 }}>
          <Text
            className="text-[14px] font-semibold"
            style={{ color: Colors.text.primary }}
            numberOfLines={2}
          >
            {item.title ?? ''}
          </Text>
          <Caption item={item} />
        </View>
      </Touchable>
    );
  }

  return (
    <Touchable
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={item.title ?? undefined}
      style={({ pressed }) => ({ width, opacity: pressed ? 0.85 : 1 })}
    >
      <View>
        <MediaCover item={item} width={width} height={Math.round(width * ASPECT)} />
        {item.locked ? <LockedOverlay item={item} variant="card" compact={variant === 'grid'} /> : null}
      </View>
      <Text
        className="text-[13px] font-semibold"
        style={{ color: Colors.text.primary, marginTop: 8 }}
        numberOfLines={2}
      >
        {item.title ?? ''}
      </Text>
      <Caption item={item} />
    </Touchable>
  );
}

function Caption({ item }: { item: MediaItem }) {
  const parts = [item.category?.name, relativeTime(item.published_at)].filter(Boolean);
  if (!parts.length) return null;
  return (
    <Text
      className="text-[11px]"
      style={{ color: Colors.text.tertiary, marginTop: 3 }}
      numberOfLines={1}
    >
      {parts.join(' · ')}
    </Text>
  );
}

export default memo(MediaCard);
