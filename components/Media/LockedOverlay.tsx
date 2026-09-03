import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Crown, Lock } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useUser } from '@/hooks/useUser';
import AnalyticsService from '@/services/AnalyticsService';
import type { MediaItem } from '@/types/media/casaMedia';
import { setPendingReturnTo } from '@/utils/returnTo';

/**
 * One `locked_view` per item per app session. A user scrolling a rail past the
 * same locked card six times is one impression, not six — and the signup
 * attribution join keys off this event.
 */
const seenThisSession = new Set<string>();

interface Props {
  item: MediaItem;
  variant?: 'card' | 'full';
  /** Suppresses the CTA on dense grids where the whole card is the target. */
  compact?: boolean;
}

/**
 * The paywall/registration wall drawn over a teaser.
 *
 * Two ladders, decided by the item's own `access_level`:
 *  - `registered` → "Sign up free to watch", which routes through the auth gate
 *    so the user comes straight back to this item, unlocked.
 *  - `premium` → "Go premium", which routes to the subscription screen with the
 *    same pending returnTo, so the same round-trip works for a paying upgrade.
 */
export default function LockedOverlay({ item, variant = 'card', compact = false }: Props) {
  const { t } = useTranslation();
  const { user } = useUser();
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const isPremiumWall = item.access_level === 'premium';
  const full = variant === 'full';

  useEffect(() => {
    if (seenThisSession.has(item.id)) return;
    seenThisSession.add(item.id);
    AnalyticsService.track('locked_view', {
      item_id: item.id,
      match_id: item.match_id ?? undefined,
      props: { access_level: item.access_level, variant },
    });
  }, [item.id, item.access_level, item.match_id, variant]);

  const handlePress = () => {
    const href = `/media/item/${item.id}`;
    // A signed-in user hitting a premium wall does not need the auth gate — and
    // `requireAuth` would return true without navigating anywhere. Send them to
    // the subscription screen, leaving this item pending so they come back to it.
    if (isPremiumWall && user?.id) {
      void setPendingReturnTo({ href, mediaId: item.id });
      AnalyticsService.track('signup_cta_click', {
        item_id: item.id,
        props: { mode: 'premium' },
      });
      router.push('/account/subscription');
      return;
    }
    requireAuth({ href, mediaId: item.id, mode: 'register' });
  };

  return (
    <View style={[StyleSheet.absoluteFill, styles.root]} pointerEvents="box-none">
      <LinearGradient
        colors={['rgba(10,10,10,0.15)', 'rgba(10,10,10,0.88)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={[styles.content, full && styles.contentFull]} pointerEvents="box-none">
        <View style={styles.iconRing}>
          {isPremiumWall ? (
            <Crown size={full ? 22 : 16} color={Colors.darkGold} />
          ) : (
            <Lock size={full ? 22 : 16} color={Colors.darkGold} />
          )}
        </View>

        <Text
          className={full ? 'text-[19px] font-bold' : 'text-[13px] font-bold'}
          style={{ color: Colors.text.primary, textAlign: 'center' }}
          numberOfLines={full ? 3 : 2}
        >
          {item.title ?? t('casaMedia.lockedTitle')}
        </Text>

        {full && item.description ? (
          <Text
            className="text-[13px] leading-5"
            style={{ color: Colors.text.secondary, textAlign: 'center', marginTop: 6 }}
            numberOfLines={3}
          >
            {item.description}
          </Text>
        ) : null}

        {!compact ? (
          <Touchable
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel={
              isPremiumWall ? t('casaMedia.goPremium') : t('casaMedia.signUpToWatch')
            }
            style={({ pressed }) => ({
              marginTop: full ? 16 : 10,
              paddingHorizontal: full ? 22 : 14,
              height: full ? 44 : 32,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: Colors.darkGold,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text
              className={full ? 'text-[14px] font-bold' : 'text-[12px] font-bold'}
              // #1A1A1A on gold, not white: white on #BC9045 is 2.91:1 and
              // fails WCAG AA. Same rule as the web dashboard's tokens.
              style={{ color: Colors.text.dark }}
              numberOfLines={1}
            >
              {isPremiumWall ? t('casaMedia.goPremium') : t('casaMedia.signUpToWatch')}
            </Text>
          </Touchable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { justifyContent: 'flex-end' },
  content: { padding: 12, alignItems: 'center' },
  contentFull: { padding: 24, paddingBottom: 40 },
  iconRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.darkGold,
    backgroundColor: 'rgba(0,0,0,0.4)',
    marginBottom: 8,
  },
});
