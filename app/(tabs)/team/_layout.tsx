import React from "react";
import { I18nManager, View } from "react-native";
import { useTranslation } from "react-i18next";

import Colors from "@/constants/colors";
import { MaterialTopTabs } from "@/components/navigation/MaterialTopTabs";
import TeamIdentityHeader from "@/components/Team/TeamIdentityHeader";
import { useFont } from "@/contexts/FontContext";
import { useFootball } from "@/hooks/useFootball";
import { REAL_MADRID_TEAM_ID } from "@/constants/football";

export default function TeamTabsLayout() {
  const { t } = useTranslation();
  const { fontFamilyBold } = useFont();
  const { teamInfoList } = useFootball();

  const teamInfo = teamInfoList.find((x) => x.team.id === REAL_MADRID_TEAM_ID);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>
      {/* Persistent across all six tabs, so it mounts once instead of six
          times. Never gate the navigator below behind a loading branch —
          Fabric's prepareForRecycle resets the pager index, so an
          unmount/remount can snap back to page 0. */}
      <TeamIdentityHeader teamInfo={teamInfo} />

      <MaterialTopTabs
        screenOptions={{
          swipeEnabled: true,
          // Defer mounting until a tab is reached — two of the six are WebViews
          // and each mount is a billed upstream call.
          lazy: true,
          lazyPreloadDistance: 0,

          // Both of these MUST live in screenOptions, never per-screen:
          // MaterialTopTabBar reads them from the FOCUSED descriptor, so
          // differing values re-lay-out the whole bar mid-swipe.
          tabBarScrollEnabled: true,
          // Numeric, not "auto" — react-native-tab-view only skips its two-pass
          // measurement when this is a number.
          tabBarItemStyle: { width: 112 },

          tabBarActiveTintColor: Colors.text.primary,
          tabBarInactiveTintColor: Colors.text.tertiary,
          tabBarLabelStyle: {
            fontSize: 13,
            textTransform: "none" as const,
            margin: 0,
            // Cairo is a separate font file, not a weight axis: pairing it with
            // fontWeight 600 makes Android synthesize a fake bold.
            ...(fontFamilyBold
              ? { fontFamily: fontFamilyBold, fontWeight: "normal" as const }
              : { fontWeight: "600" as const }),
            ...(I18nManager.isRTL ? { lineHeight: 22 } : { lineHeight: 18 }),
          },
          tabBarStyle: {
            backgroundColor: Colors.background.medium,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border.default,
          },
          tabBarIndicatorStyle: {
            backgroundColor: Colors.darkGold,
            height: 3,
          },
          tabBarPressColor: "rgba(188,144,69,0.18)",

          // Required. MaterialTopTabView hard-codes backgroundColor from the
          // navigation theme, and expo-router defaults to DefaultTheme — WHITE.
          // Without this every swipe flashes white in a dark app.
          sceneStyle: { backgroundColor: Colors.background.deepDark },
        }}
      >
        {/* Declaration order is tab order. */}
        <MaterialTopTabs.Screen name="index" options={{ title: t("team.tabDetails") }} />
        <MaterialTopTabs.Screen name="matches" options={{ title: t("team.tabMatches") }} />
        <MaterialTopTabs.Screen name="standings" options={{ title: t("team.tabStandings") }} />
        <MaterialTopTabs.Screen name="squad" options={{ title: t("team.tabSquad") }} />
        <MaterialTopTabs.Screen name="top-players" options={{ title: t("team.tabTopPlayers") }} />
        <MaterialTopTabs.Screen name="statistics" options={{ title: t("team.tabStats") }} />
      </MaterialTopTabs>
    </View>
  );
}
