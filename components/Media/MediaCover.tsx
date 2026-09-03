import { Image } from 'expo-image';
import { Clapperboard, Images, Lock, Play } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Text';
import Colors from '@/constants/colors';
import type { MediaItem } from '@/types/media/casaMedia';
import { coverUri, formatDuration } from '@/utils/mediaUrl';

interface Props {
  item: MediaItem;
  width: number;
  height: number;
  radius?: number;
  /** Type / duration / lock chips. Off for the story ring and hero crops. */
  showBadges?: boolean;
}

/**
 * The one cover image recipe.
 *
 * Two things it always does: request a ladder width (`utils/mediaUrl.ts`) so
 * expo-image's disk cache is shared between the rail, the grid and the match
 * page, and paint the blurhash first so a slow signed URL never shows a hole.
 */
export default function MediaCover({
  item,
  width,
  height,
  radius = 12,
  showBadges = true,
}: Props) {
  const uri = coverUri(item, width);
  const duration = formatDuration(item.duration_ms);

  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        overflow: 'hidden',
        backgroundColor: Colors.background.card,
      }}
    >
      <Image
        source={uri ? { uri } : undefined}
        placeholder={item.cover_blurhash ?? undefined}
        placeholderContentFit="cover"
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={160}
        cachePolicy="memory-disk"
        recyclingKey={item.id}
        accessibilityIgnoresInvertColors
      />

      {showBadges ? (
        <>
          {item.type === 'video' ? (
            <View style={styles.playBadge}>
              <Play size={16} color={Colors.textWhite} fill={Colors.textWhite} />
            </View>
          ) : null}

          <View style={styles.badgeRow} pointerEvents="none">
            {item.type === 'gallery' ? (
              <Badge icon={<Images size={11} color={Colors.textWhite} />}>
                {String(item.asset_count || 0)}
              </Badge>
            ) : null}
            {item.type === 'story' ? (
              <Badge icon={<Clapperboard size={11} color={Colors.textWhite} />} />
            ) : null}
            {duration ? <Badge>{duration}</Badge> : null}
            {item.locked ? <Badge icon={<Lock size={11} color={Colors.textWhite} />} /> : null}
          </View>
        </>
      ) : null}
    </View>
  );
}

function Badge({ children, icon }: { children?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <View style={styles.badge}>
      {icon}
      {children ? (
        <Text
          style={styles.badgeText}
          // Digits must not be bidi-reordered next to Arabic copy.
          maxFontSizeMultiplier={1.2}
        >
          {children}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  playBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 40,
    height: 40,
    marginTop: -20,
    marginLeft: -20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  badgeRow: {
    position: 'absolute',
    bottom: 6,
    start: 6,
    end: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  badgeText: {
    color: Colors.textWhite,
    fontSize: 10,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    writingDirection: 'ltr',
  },
});
