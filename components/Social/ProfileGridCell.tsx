import { Image } from 'expo-image';
import { AlignLeft, Copy, Play } from 'lucide-react-native';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import type { ProfileGridItem } from '@/types/social';
import { gridBadge } from '@/utils/profileGrid.core';

interface Props {
  item: ProfileGridItem;
  size: number;
  onPress: (item: ProfileGridItem) => void;
}

/**
 * One square of the profile grid — the `GalleryGrid` cell, with a corner badge
 * for a video or several photos. A text post has no thumbnail, so it gets a
 * text tile instead.
 */
function ProfileGridCell({ item, size, onPress }: Props) {
  const { t } = useTranslation();
  const badge = gridBadge(item);
  const label =
    badge === 'video'
      ? t('social.profile.grid.video')
      : badge === 'multi'
        ? t('social.profile.grid.photos')
        : item.thumb_url
          ? t('social.profile.grid.photo')
          : t('social.profile.grid.text');

  return (
    <Touchable
      onPress={() => onPress(item)}
      accessibilityRole="imagebutton"
      accessibilityLabel={label}
      style={({ pressed }) => ({ width: size, height: size, opacity: pressed ? 0.8 : 1 })}
    >
      <View style={styles.cell}>
        {item.thumb_url ? (
          <Image
            source={{ uri: item.thumb_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={120}
            cachePolicy="memory-disk"
            recyclingKey={item.id}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={styles.textTile}>
            <AlignLeft size={Math.max(18, Math.round(size / 5))} color={Colors.darkGold} />
          </View>
        )}
        {badge ? (
          // `end`, not `right`: the badge sits on the trailing corner in both directions.
          <View pointerEvents="none" style={styles.badge}>
            {badge === 'video' ? <Play size={14} color="#fff" fill="#fff" /> : <Copy size={14} color="#fff" />}
          </View>
        ) : null}
      </View>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  cell: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: Colors.background.card,
  },
  textTile: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border.default,
  },
  badge: {
    position: 'absolute',
    top: 6,
    end: 6,
    padding: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
});

export default memo(ProfileGridCell);
