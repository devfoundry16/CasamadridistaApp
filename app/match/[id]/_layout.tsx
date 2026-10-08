import { useGlobalSearchParams, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { I18nManager, View } from 'react-native';

import MatchHeader from '@/components/Match/Center/MatchHeader';
import MatchIdentityStrip from '@/components/Media/Match/MatchIdentityStrip';
import { MaterialTopTabs } from '@/components/navigation/MaterialTopTabs';
import Colors from '@/constants/colors';
import { useFont } from '@/contexts/FontContext';
import { useMatchSummary } from '@/hooks/football/matchCenter';
import { useMatchMedia } from '@/hooks/media/useMatchMedia';

/**
 * The match page: Details, Predictions, Lineups, Head-to-Head, Form,
 * Statistics, Media and Community. The first six come from the match centre
 * endpoints (/api/match/fixture/:id/*), one query per tab.
 *
 * `router.push('/match/<fixtureId>')` from the team pages lands on `index`
 * (Details).
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

  // The header comes from the match centre summary, which knows every
  // fixture. The Casa Media match is the fallback while it loads or if it
  // fails; the Media tab shares that query through the React Query cache.
  const { data: summary } = useMatchSummary(matchId);
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
      {summary ? (
        <MatchHeader match={summary.match} />
      ) : (
        <MatchIdentityStrip match={match} fallbackTitle={t('nav.matchDetails')} />
      )}

      <MaterialTopTabs
        screenOptions={{
          swipeEnabled: true,
          lazy: true,
          lazyPreloadDistance: 0,
          // Eight tabs do not fit a phone's width: the bar scrolls. Numeric
          // width, as in app/(tabs)/team/_layout.tsx: react-native-tab-view
          // only skips its two-pass measurement for a number. 124 fits the
          // longest label.
          tabBarScrollEnabled: true,
          tabBarItemStyle: { width: 124 },
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
        <MaterialTopTabs.Screen name="predictions" options={{ title: t('match.tabs.predictions') }} />
        <MaterialTopTabs.Screen name="lineups" options={{ title: t('match.tabs.lineups') }} />
        <MaterialTopTabs.Screen name="h2h" options={{ title: t('match.tabs.h2h') }} />
        <MaterialTopTabs.Screen name="form" options={{ title: t('match.tabs.form') }} />
        <MaterialTopTabs.Screen name="stats" options={{ title: t('match.tabs.stats') }} />
        <MaterialTopTabs.Screen name="media" options={{ title: t('match.tabs.media') }} />
        <MaterialTopTabs.Screen name="community" options={{ title: t('match.tabs.community') }} />
      </MaterialTopTabs>
    </View>
  );
}
