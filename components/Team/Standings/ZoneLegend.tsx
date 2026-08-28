import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/Text";
import Colors from "@/constants/colors";
import { legendZones, type StandingsSection } from "./zones";
import { STANDINGS_LAYOUT as L } from "./layout";

/**
 * What the rail colours mean, listing only the zones this table actually has.
 *
 * Shown for the overall table only. Qualification is decided by the overall
 * standings, so a legend under a home-only or away-only table would be
 * explaining colours that aren't there.
 */
export default function ZoneLegend({ sections }: { sections: StandingsSection[] }) {
  const { t } = useTranslation();
  const zones = legendZones(sections);
  if (zones.length === 0) return null;

  return (
    <View style={{ paddingHorizontal: L.outerPadding, paddingTop: 20, gap: 8 }}>
      <Text className="text-[11px] font-bold" style={{ color: Colors.text.tertiary }}>
        {t("team.legendTitle")}
      </Text>
      <View style={{ gap: 6 }}>
        {zones.map((zone) => (
          <View key={zone.key} style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: L.railWidth,
                height: 12,
                borderRadius: 2,
                marginEnd: 8,
                backgroundColor: zone.color,
              }}
            />
            <Text className="text-[12px]" style={{ color: Colors.text.secondary }}>
              {zone.stageLabel ??
                (zone.labelKey ? t(zone.labelKey) : zone.rawDescription)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
