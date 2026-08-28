import React from "react";
import { I18nManager, View } from "react-native";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Text } from "@/components/Text";
import Touchable from "@/components/Touchable";
import Colors from "@/constants/colors";
import type { StandingSplit } from "@/types/soccer/standings";
import FormPills from "./FormPills";
import { STANDINGS_LAYOUT as L } from "./layout";

interface Props {
  split: StandingSplit;
  /** Overall only — hidden in Home/Away, where `form` would be a false claim. */
  form: string | null;
  onViewTeam?: () => void;
}

/**
 * The panel behind a tap on a row: the stats the three-column table leaves out.
 *
 * This is an inline accordion rather than a bottom sheet or a route because
 * everything it shows is already in memory on the StandingRow — no fetch, no
 * route, no new dependency. A sheet would also fight the MaterialTopTabs pager
 * for horizontal gestures, and navigating to app/team/[id] is documented as
 * cost-managed (each visit triggers upstream calls), which is far too expensive
 * for "what's their goal difference".
 */
export default function StandingsRowDetail({ split, form, onViewTeam }: Props) {
  const { t } = useTranslation();
  const Chevron = I18nManager.isRTL ? ChevronLeft : ChevronRight;

  return (
    <View
      style={{
        paddingStart: L.rowPaddingH + L.railWidth,
        paddingEnd: L.rowPaddingH,
        paddingBottom: 14,
        gap: 12,
      }}
    >
      <View style={{ height: 1, backgroundColor: Colors.border.default }} />

      <View style={{ flexDirection: "row" }}>
        <Cell label={t("team.statWon")} value={split.win} />
        <Cell label={t("team.statDrawn")} value={split.draw} />
        <Cell label={t("team.statLost")} value={split.lose} />
        <Cell label={t("team.statGoalsFor")} value={split.goals.for} />
        <Cell label={t("team.statGoalsAgainst")} value={split.goals.against} />
      </View>

      {form ? (
        <View style={{ gap: 6 }}>
          <Text className="text-[11px] font-bold" style={{ color: Colors.text.tertiary }}>
            {t("team.recentForm")}
          </Text>
          <FormPills form={form} />
        </View>
      ) : null}

      {onViewTeam ? (
        <Touchable
          onPress={onViewTeam}
          accessibilityRole="link"
          accessibilityLabel={t("team.viewTeam")}
          style={({ pressed }) => [
            { flexDirection: "row", alignItems: "center", opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text className="text-[13px] font-semibold" style={{ color: Colors.darkGold }}>
            {t("team.viewTeam")}
          </Text>
          <Chevron size={15} color={Colors.darkGold} style={{ marginStart: 2 }} />
        </Touchable>
      ) : null}
    </View>
  );
}

function Cell({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flex: 1, gap: 3 }}>
      <Text
        className="text-[10px] font-bold"
        style={{ color: Colors.text.muted }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        className="text-[14px] font-semibold"
        style={{
          color: Colors.text.primary,
          fontVariant: ["tabular-nums"],
          writingDirection: "ltr",
        }}
        maxFontSizeMultiplier={1.2}
      >
        {value}
      </Text>
    </View>
  );
}
