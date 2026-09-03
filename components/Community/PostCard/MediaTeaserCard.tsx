import { useRouter } from 'expo-router';
import { Clapperboard } from 'lucide-react-native';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, useWindowDimensions } from 'react-native';

import LockedOverlay from '@/components/Media/LockedOverlay';
import MediaCover from '@/components/Media/MediaCover';
import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import type { MediaItem } from '@/types/media/casaMedia';

interface Props {
  item: MediaItem;
}

/**
 * A Casa Media item surfaced inside the community feed.
 *
 * Deliberately a cover + CTA, never an inline player: the feed already mounts a
 * `VideoView` per visible post for user video, and a second one for exclusive
 * content would double the decode cost while giving the item away for free.
 * Tapping goes to the media item screen, where the access check happens.
 */
function MediaTeaserCard({ item }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const coverWidth = screenWidth - 32;

  return (
    <Touchable
      onPress={() => router.push(`/media/item/${item.id}`)}
      accessibilityRole="button"
      accessibilityLabel={item.title ?? t('casaMedia.hubTitle')}
      style={({ pressed }) => ({
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border.default,
        backgroundColor: Colors.background.card,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <View>
        <MediaCover
          item={item}
          width={coverWidth}
          height={Math.round(coverWidth * (9 / 16))}
          radius={0}
        />
        {item.locked ? <LockedOverlay item={item} variant="card" /> : null}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
        <Clapperboard size={16} color={Colors.darkGold} />
        <View style={{ flex: 1, marginStart: 10 }}>
          <Text
            className="text-[11px] font-bold"
            style={{ color: Colors.darkGold }}
            numberOfLines={1}
          >
            {t('casaMedia.hubTitle')}
          </Text>
          <Text
            className="text-[14px] font-semibold"
            style={{ color: Colors.text.primary, marginTop: 2 }}
            numberOfLines={2}
          >
            {item.title ?? ''}
          </Text>
        </View>
      </View>
    </Touchable>
  );
}

export default memo(MediaTeaserCard);
