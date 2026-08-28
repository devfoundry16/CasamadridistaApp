import React from "react";
import { I18nManager, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/Text";
import Colors from "@/constants/colors";
import {
  STANDINGS_LAYOUT as L,
  STANDINGS_HEADER_INSET_END,
  STANDINGS_HEADER_INSET_START,
} from "./layout";

/**
 * The `# / TEAM / P / DIFF / PTS` strip.
 *
 * Sits on the page background above the first band, not inside a card, so it
 * reproduces the rows' inset from STANDINGS_HEADER_INSET_* rather than padding
 * of its own. Column widths come from the same constants the rows use, which is
 * what keeps the two aligned.
 */
export default function StandingsHeaderRow() {
  const { t } = useTranslation();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingStart: STANDINGS_HEADER_INSET_START,
        paddingEnd: STANDINGS_HEADER_INSET_END,
        paddingTop: 14,
        paddingBottom: 8,
      }}
    >
      {/* The rank cell has no leading margin in StandingsRow, so none here. */}
      <Label width={L.rankWidth} marginStart={0}>
        {t("team.colRank")}
      </Label>

      <View style={{ flex: 1, marginStart: L.crestGap * 2 + L.crestSize }}>
        <Text
          className="text-[11px] font-bold"
          style={{
            color: Colors.text.tertiary,
            // letterSpacing breaks Cairo ligatures — see SectionHeading.
            letterSpacing: I18nManager.isRTL ? undefined : 0.4,
          }}
        >
          {t("team.colTeam").toUpperCase()}
        </Text>
      </View>

      <Label width={L.colPlayed}>{t("team.colPlayed")}</Label>
      <Label width={L.colDiff}>{t("team.colGoalDiff")}</Label>
      <Label width={L.colPoints}>{t("team.colPoints")}</Label>
    </View>
  );
}

function Label({
  width,
  marginStart = L.colGap,
  children,
}: {
  width: number;
  marginStart?: number;
  children: React.ReactNode;
}) {
  return (
    <View style={{ width, marginStart }}>
      <Text
        className="text-[11px] font-bold"
        style={{ textAlign: "center", color: Colors.text.tertiary }}
        numberOfLines={1}
        maxFontSizeMultiplier={1.2}
      >
        {children}
      </Text>
    </View>
  );
}
