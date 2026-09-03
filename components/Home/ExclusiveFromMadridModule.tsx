import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import MediaRail from '@/components/Media/MediaRail';
import StoriesRow from '@/components/Media/Stories/StoriesRow';
import TimelineRow from '@/components/Media/TimelineRow';
import SectionHeading from '@/components/Team/SectionHeading';
import Colors from '@/constants/colors';
import { useMediaHome } from '@/hooks/media/useHome';

/**
 * The Casa Media presence on the Home screen.
 *
 * Two shapes, decided by the payload rather than by the caller: when the
 * correspondent is publishing against a live match the module leads with the
 * "From Madrid Now" drops; otherwise it is the stories rail plus the featured
 * rail. Renders nothing at all while empty or loading — Home must never grow a
 * skeleton block that turns out to be permanent.
 */
export default function ExclusiveFromMadridModule() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data } = useMediaHome();

  if (!data) return null;

  const now = data.from_madrid_now;
  const hasNow = !!now && now.items.length > 0;
  const hasStories = data.stories.length > 0;
  const hasFeatured = data.featured.length > 0;

  if (!hasNow && !hasStories && !hasFeatured) return null;

  return (
    <View style={{ paddingVertical: 12, backgroundColor: Colors.background.deepDark }}>
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

      {hasFeatured ? (
        <MediaRail
          title={t('casaMedia.exclusiveFromMadrid')}
          items={data.featured}
          seeAllLabel={t('casaMedia.seeAll')}
          onSeeAll={() => router.push('/media')}
        />
      ) : null}
    </View>
  );
}
