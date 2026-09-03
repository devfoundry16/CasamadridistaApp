import { useGlobalSearchParams, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { I18nManager, View } from 'react-native';

import MatchIdentityStrip from '@/components/Media/Match/MatchIdentityStrip';
import { MaterialTopTabs } from '@/components/navigation/MaterialTopTabs';
import Colors from '@/constants/colors';
import { useFont } from '@/contexts/FontContext';
import { useMatchMedia } from '@/hooks/media/useMatchMedia';

/**
 * The match page is now three tabs (details / media / community).
 *
 * `router.push('/match/<fixtureId>')` from the team pages still lands on
 * `index`, which is the original widget screen moved here verbatim — turning a
 * leaf route into a directory does not change its href.
 *
 * Options are copied from `app/(tabs)/team/_layout.tsx`; the comments there
 * explain why `tabBarScrollEnabled`, `tabBarItemStyle` and `sceneStyle` must
 * live in `screenOptions` rather than per-screen.
 */
export default function MatchTabsLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const { fontFamilyBold } = useFont();
  const { id } = useLocalSearchParams<{ id: string }>();
  // `tab` MUST come from the global params. `useLocalSearchParams` is scoped to
  // this layout's own route segment, and an external link to
  // `/match/123?tab=media` puts the query on the focused child route — so the
  // local hook returned undefined and the one-shot replace below never ran.
  const { tab } = useGlobalSearchParams<{ tab?: string }>();
  const matchId = Number.parseInt(id ?? '', 10);

  // Header data comes off the unfiltered match-media query, which the Media tab
  // also uses — one request, shared through the React Query cache.
  const { data } = useMatchMedia(Number.isFinite(matchId) ? matchId : undefined);
  const match = data?.pages[0]?.match ?? null;

  // `?tab=media` (used by push deep links and the exclusive banner) is honoured
  // exactly once — a repeat would fight the user's own tab taps.
  const redirected = useRef(false);
  useEffect(() => {
    if (redirected.current || !tab || !id) return;
    redirected.current = true;
    if (tab === 'media') router.replace({ pathname: '/match/[id]/media', params: { id } });
    else if (tab === 'community')
      router.replace({ pathname: '/match/[id]/community', params: { id } });
  }, [tab, id, router]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>
      {/* Mounted once here, so it does not remount per tab. */}
      <MatchIdentityStrip match={match} fallbackTitle={t('nav.matchDetails')} />

      <MaterialTopTabs
        screenOptions={{
          swipeEnabled: true,
          lazy: true,
          lazyPreloadDistance: 0,
          tabBarScrollEnabled: false,
          tabBarItemStyle: { width: 'auto' },
          tabBarActiveTintColor: Colors.text.primary,
          tabBarInactiveTintColor: Colors.text.tertiary,
          tabBarLabelStyle: {
            fontSize: 13,
            textTransform: 'none' as const,
            margin: 0,
            // Cairo is a separate file, not a weight axis — pairing it with a
            // numeric weight makes Android synthesize a fake bold.
            ...(fontFamilyBold
              ? { fontFamily: fontFamilyBold, fontWeight: 'normal' as const }
              : { fontWeight: '600' as const }),
            ...(I18nManager.isRTL ? { lineHeight: 22 } : { lineHeight: 18 }),
          },
          tabBarStyle: {
            backgroundColor: Colors.background.medium,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border.default,
          },
          tabBarIndicatorStyle: { backgroundColor: Colors.darkGold, height: 3 },
          tabBarPressColor: 'rgba(188,144,69,0.18)',
          // Required: MaterialTopTabView hard-codes the navigation theme's
          // background, and expo-router defaults to DefaultTheme — WHITE.
          sceneStyle: { backgroundColor: Colors.background.deepDark },
        }}
      >
        {/* Declaration order is tab order. */}
        <MaterialTopTabs.Screen name="index" options={{ title: t('match.tabs.details') }} />
        <MaterialTopTabs.Screen name="media" options={{ title: t('match.tabs.media') }} />
        <MaterialTopTabs.Screen name="community" options={{ title: t('match.tabs.community') }} />
      </MaterialTopTabs>
    </View>
  );
}
