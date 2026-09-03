import { useRouter } from 'expo-router';
import React, { memo } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import type { MediaItem } from '@/types/media/casaMedia';
import LockedOverlay from './LockedOverlay';
import MediaCover from './MediaCover';
import { clockTime } from './time';

interface Props {
  item: MediaItem;
  /** Last row draws no connector below the dot. */
  isLast?: boolean;
}

const THUMB = 92;
const RAIL_WIDTH = 44;

/**
 * One drop in the "From Madrid Now" timeline.
 *
 * The time gutter and connector are laid out with `start`/`marginStart` so the
 * whole spine mirrors to the right-hand side under Arabic without any transform.
 */
function TimelineRow({ item, isLast = false }: Props) {
  const router = useRouter();
  const time = clockTime(item.published_at);

  return (
    <Touchable
      onPress={() => router.push(`/media/item/${item.id}`)}
      accessibilityRole="button"
      accessibilityLabel={item.title ?? undefined}
      style={({ pressed }) => ({
        flexDirection: 'row',
        paddingHorizontal: 16,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ width: RAIL_WIDTH, alignItems: 'center' }}>
        <Text
          className="text-[11px] font-semibold"
          style={{
            color: Colors.text.tertiary,
            fontVariant: ['tabular-nums'],
            writingDirection: 'ltr',
          }}
        >
          {time ?? ''}
        </Text>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            marginTop: 4,
            backgroundColor: Colors.darkGold,
          }}
        />
        {!isLast ? (
          <View style={{ flex: 1, width: 1, backgroundColor: Colors.border.default, marginTop: 2 }} />
        ) : null}
      </View>

      <View style={{ flex: 1, paddingBottom: 16, flexDirection: 'row' }}>
        <View>
          <MediaCover item={item} width={THUMB} height={Math.round(THUMB * (9 / 16))} radius={10} />
          {item.locked ? <LockedOverlay item={item} variant="card" compact /> : null}
        </View>
        <View style={{ flex: 1, marginStart: 10 }}>
          <Text
            className="text-[13px] font-semibold"
            style={{ color: Colors.text.primary }}
            numberOfLines={2}
          >
            {item.title ?? ''}
          </Text>
          {item.description ? (
            <Text
              className="text-[12px] leading-4"
              style={{ color: Colors.text.tertiary, marginTop: 2 }}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          ) : null}
        </View>
      </View>
    </Touchable>
  );
}

export default memo(TimelineRow);
