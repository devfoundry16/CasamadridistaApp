import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, useWindowDimensions } from 'react-native';

import LockedOverlay from '@/components/Media/LockedOverlay';
import MediaCover from '@/components/Media/MediaCover';
import MediaRail from '@/components/Media/MediaRail';
import StoriesRow from '@/components/Media/Stories/StoriesRow';
import TimelineRow from '@/components/Media/TimelineRow';
import SectionHeading from '@/components/Team/SectionHeading';
import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { useMediaHome } from '@/hooks/media/useHome';
import { homeHeadline, matchTitle } from '@/services/media/normalise';
import { MediaSurfaceProvider } from '@/components/Media/MediaSurfaceContext';

/**
 * The Casa Media presence on the Home screen.
 *
 * Two shapes, decided by the payload rather than by the caller: when the
 * correspondent is publishing against a live match the module leads with the
 * "From Madrid Now" drops; otherwise it is the stories rail plus the featured
 * rail. Renders nothing at all while empty or loading — Home must never grow a
 * skeleton block that turns out to be permanent.
 *
 * It opens with the headline (§18): the match, "New from the Bernabéu", the
 * newest item's cover and a WATCH NOW button.
 */
export default function ExclusiveFromMadridModule() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data } = useMediaHome();
  const { width: screenWidth } = useWindowDimensions();

  if (!data) return null;

  const now = data.from_madrid_now;
  const hasNow = !!now && now.items.length > 0;
  const hasStories = data.stories.length > 0;
  // The rail is the `home_exclusive` placement surface when an editor has
  // curated it, and the media home's featured rail when they have not — so the
  // module never goes blank just because nobody placed anything here yet.
  const exclusive = data.home_exclusive.length > 0 ? data.home_exclusive : data.featured;
  const hasExclusive = exclusive.length > 0;

  if (!hasNow && !hasStories && !hasExclusive) return null;

  const headline = homeHeadline(data);
  const coverWidth = screenWidth - 32;

  return (
    <MediaSurfaceProvider surface="home">
      <View style={{ paddingVertical: 12, backgroundColor: Colors.background.deepDark }}>
        {headline ? (
          <Touchable
            onPress={() =>
              router.push({
                pathname: '/media/item/[id]',
                params: { id: headline.item.id, surface: 'home' },
              })
            }
            accessibilityRole="button"
            accessibilityLabel={[
              t('casaMedia.exclusiveLabel'),
              matchTitle(headline.match),
              t('casaMedia.watchNow'),
            ]
              .filter(Boolean)
              .join(', ')}
            style={({ pressed }) => ({
              marginHorizontal: 16,
              marginBottom: 8,
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
                item={headline.item}
                width={coverWidth}
                height={Math.round(coverWidth * (9 / 16))}
                radius={0}
              />
              {headline.item.locked ? <LockedOverlay item={headline.item} variant="card" compact /> : null}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
              <View style={{ flex: 1 }}>
                <Text className="text-[11px] font-bold" style={{ color: Colors.darkGold }} numberOfLines={1}>
                  {t('casaMedia.exclusiveLabel')}
                </Text>
                {matchTitle(headline.match) ? (
                  <Text
                    className="text-[15px] font-bold"
                    style={{ color: Colors.text.primary, marginTop: 2 }}
                    numberOfLines={1}
                  >
                    {matchTitle(headline.match)}
                  </Text>
                ) : null}
                <Text
                  className="text-[13px]"
                  style={{ color: Colors.text.secondary, marginTop: 2 }}
                  numberOfLines={1}
                >
                  {t('casaMedia.newFromBernabeu')}
                </Text>
              </View>
              {/* Drawn as a button; the card itself is the control. */}
              <View
                style={{
                  marginStart: 12,
                  paddingHorizontal: 14,
                  height: 34,
                  borderRadius: 17,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: Colors.darkGold,
                }}
              >
                <Text className="text-[12px] font-bold" style={{ color: Colors.text.dark }} numberOfLines={1}>
                  {t('casaMedia.watchNow')}
                </Text>
              </View>
            </View>
          </Touchable>
        ) : null}

        {hasStories ? <StoriesRow groups={data.stories} compact /> : null}

        {hasNow ? (
          <View style={{ marginTop: 8 }}>
            <View style={{ paddingHorizontal: 16 }}>
              <SectionHeading
                title={t('casaMedia.fromMadridNow')}
                action={
                  now?.match
                    ? {
                        label: t('casaMedia.seeAll'),
                        onPress: () =>
                          router.push({
                            pathname: '/media/now',
                            params: { matchId: String(now.match!.id) },
                          }),
                      }
                    : undefined
                }
              />
            </View>
            {now!.items.slice(0, 3).map((item, index, list) => (
              <TimelineRow key={item.id} item={item} isLast={index === list.length - 1} />
            ))}
          </View>
        ) : null}

        {hasExclusive ? (
          <MediaRail
            title={t('casaMedia.exclusiveFromMadrid')}
            items={exclusive}
            seeAllLabel={t('casaMedia.seeAll')}
            onSeeAll={() => router.push('/media')}
          />
        ) : null}
      </View>
    </MediaSurfaceProvider>
  );
}
