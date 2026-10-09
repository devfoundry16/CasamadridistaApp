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
  /** Show the item's short description. Off when the post body already says it. */
  preview?: boolean;
}

/**
 * A Casa Media item surfaced inside the community feed.
 *
 * Deliberately a cover + CTA, never an inline player: the feed plays one fan
 * video at a time (FeedPlayback), and playing exclusive content here would add
 * a second player while giving the item away for free.
 * Tapping goes to the media item screen, where the access check happens.
 */
function MediaTeaserCard({ item, preview = true }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const coverWidth = screenWidth - 32;

  return (
    <Touchable
      onPress={() =>
        router.push({ pathname: '/media/item/[id]', params: { id: item.id, surface: 'community' } })
      }
      accessibilityRole="button"
      accessibilityLabel={[t('casaMedia.exclusiveLabel'), item.title, t('casaMedia.watchInCasaMedia')]
        .filter(Boolean)
        .join(', ')}
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

      <View style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Clapperboard size={14} color={Colors.darkGold} />
          <Text
            className="text-[11px] font-bold"
            style={{ color: Colors.darkGold, marginStart: 6 }}
            numberOfLines={1}
          >
            {t('casaMedia.exclusiveLabel')}
          </Text>
        </View>
        {item.title ? (
          <Text
            className="text-[14px] font-semibold"
            style={{ color: Colors.text.primary, marginTop: 4 }}
            numberOfLines={2}
          >
            {item.title}
          </Text>
        ) : null}
        {/* The short preview text (§16): the public teaser line, the same one a
            locked item shows. */}
        {preview && item.description ? (
          <Text
            className="text-[13px] leading-5"
            style={{ color: Colors.text.secondary, marginTop: 4 }}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        ) : null}
        {/* Drawn as a button, but the whole card is the control: a second
            touchable inside it would be a nested press target. */}
        <View
          style={{
            alignSelf: 'flex-start',
            marginTop: 10,
            paddingHorizontal: 14,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: Colors.darkGold,
          }}
        >
          <Text className="text-[12px] font-bold" style={{ color: Colors.text.dark }} numberOfLines={1}>
            {t('casaMedia.watchInCasaMedia')}
          </Text>
        </View>
      </View>
    </Touchable>
  );
}

export default memo(MediaTeaserCard);
