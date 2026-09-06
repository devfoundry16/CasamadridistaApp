import { useRouter } from 'expo-router';
import {
  Image as ImageIcon,
  Images,
  Lock,
  Play,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, useWindowDimensions } from 'react-native';

import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { collectionTitleKey } from '@/hooks/media/collections';
import type { MediaCollection } from '@/types/media/casaMedia';

const COLUMNS = 3;
const GAP = 8;
const EDGE = 16;

/**
 * A floor, not a fixed height, so a label that grows past two lines under
 * Dynamic Type pushes the tile taller instead of being clipped. The two rows
 * stay level because a flex-wrap line sizes to its tallest child and the
 * default `alignItems: stretch` grows the rest to match.
 */
const MIN_TILE_HEIGHT = 76;

/**
 * The six collections the client's spec lists that nothing else in the app
 * navigates to. Every route already exists under `app/media/list/[collection]`.
 *
 * Typed `MediaCollection` on purpose: `[collection].tsx` resolves an unknown
 * segment to `'all'` rather than erroring, so a mistyped slug would silently
 * render the whole unfiltered library under a specific header.
 */
const TILES: { collection: MediaCollection; Icon: LucideIcon }[] = [
  { collection: 'latest-match', Icon: Trophy },
  { collection: 'videos', Icon: Play },
  { collection: 'photos', Icon: ImageIcon },
  { collection: 'galleries', Icon: Images },
  { collection: 'trending', Icon: TrendingUp },
  { collection: 'exclusive', Icon: Lock },
];

/**
 * The 3x2 grid of collection entry points at the top of the Casa Media hub.
 *
 * No props: the six destinations are the whole reason the component exists and
 * they are fixed by the product spec.
 *
 * The 1px border is load-bearing, not decoration — card (#2F2F2F) on page
 * (#1A1A1A) is a 1.30:1 step, so without it the tile edge is invisible. Gold is
 * the icon only; the gold *fill* is spent once on the Details hero and white on
 * gold is 2.91:1 (fails AA) anyway.
 */
export default function CollectionGrid() {
  const { t } = useTranslation();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  const tileWidth = Math.floor((screenWidth - EDGE * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: GAP,
        paddingHorizontal: EDGE,
      }}
    >
      {TILES.map(({ collection, Icon }) => {
        // Same helper the destination screen titles itself with, so the tile
        // label and the header it opens can never drift apart.
        const title = t(collectionTitleKey(collection));

        return (
          <Touchable
            key={collection}
            onPress={() => router.push(`/media/list/${collection}`)}
            accessibilityRole="button"
            accessibilityLabel={title}
            style={({ pressed }) => ({
              width: tileWidth,
              minHeight: MIN_TILE_HEIGHT,
              paddingVertical: 8,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingHorizontal: 6,
              borderRadius: 14,
              backgroundColor: Colors.background.card,
              borderWidth: 1,
              borderColor: Colors.border.default,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Icon size={20} color={Colors.darkGold} />
            <Text
              className="text-[12px] font-semibold text-center"
              numberOfLines={2}
              style={{ color: Colors.text.secondary }}
            >
              {title}
            </Text>
          </Touchable>
        );
      })}
    </View>
  );
}
