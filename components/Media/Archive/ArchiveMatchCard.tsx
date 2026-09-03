import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import SurfaceCard from '@/components/Team/SurfaceCard';
import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import type { MediaArchiveEntry } from '@/types/media/casaMedia';
import { coverUri } from '@/utils/mediaUrl';

interface Props {
  entry: MediaArchiveEntry;
}

/**
 * One archived match: scoreline, competition, and up to three cover thumbnails.
 * Tapping goes straight to that match's media tab.
 */
function ArchiveMatchCard({ entry }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const thumb = Math.floor((screenWidth - 32 - 2 - 16) / 3);
  const { match } = entry;

  return (
    <Touchable
      onPress={() =>
        router.push({ pathname: '/match/[id]/media', params: { id: String(match.id) } })
      }
      accessibilityRole="button"
      accessibilityLabel={`${match.home.name} ${match.away.name}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1, marginBottom: 12 })}
    >
      <SurfaceCard padded={false}>
        <View style={styles.header}>
          <Crest uri={match.home.logo} />
          <Text
            className="text-[13px] font-semibold"
            style={{ flex: 1, color: Colors.text.primary, marginStart: 8 }}
            numberOfLines={1}
          >
            {match.home.name}
          </Text>
          <Text
            className="text-[14px] font-bold"
            style={{
              color: Colors.text.primary,
              paddingHorizontal: 8,
              fontVariant: ['tabular-nums'],
              writingDirection: 'ltr',
            }}
          >
            {match.goals_home != null && match.goals_away != null
              ? `${match.goals_home} - ${match.goals_away}`
              : 'vs'}
          </Text>
          <Text
            className="text-[13px] font-semibold"
            style={{ flex: 1, color: Colors.text.primary, marginEnd: 8 }}
            numberOfLines={1}
          >
            {match.away.name}
          </Text>
          <Crest uri={match.away.logo} />
        </View>

        <View style={styles.thumbRow}>
          {entry.cover_items.slice(0, 3).map((item) => {
            const uri = coverUri(item, thumb);
            return (
              <Image
                key={item.id}
                source={uri ? { uri } : undefined}
                placeholder={item.cover_blurhash ?? undefined}
                placeholderContentFit="cover"
                style={{
                  width: thumb,
                  height: Math.round(thumb * (9 / 16)),
                  borderRadius: 6,
                  backgroundColor: Colors.background.light,
                }}
                contentFit="cover"
                transition={140}
                cachePolicy="memory-disk"
                recyclingKey={item.id}
                accessibilityIgnoresInvertColors
              />
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text className="text-[11px]" style={{ color: Colors.text.tertiary }} numberOfLines={1}>
            {match.league?.name ?? ''}
          </Text>
          <Text className="text-[11px] font-semibold" style={{ color: Colors.darkGold }}>
            {t('casaMedia.archiveCount', { value: entry.media_count })}
          </Text>
        </View>
      </SurfaceCard>
    </Touchable>
  );
}

function Crest({ uri }: { uri: string | null }) {
  if (!uri) return <View style={{ width: 22, height: 22 }} />;
  return (
    <Image
      source={{ uri }}
      style={{ width: 22, height: 22 }}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },
  thumbRow: { flexDirection: 'row', gap: 2, paddingHorizontal: 8 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});

export default memo(ArchiveMatchCard);
