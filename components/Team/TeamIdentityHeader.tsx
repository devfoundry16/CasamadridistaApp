import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import CountryFlag from "react-native-country-flag";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/Text";
import Colors from "@/constants/colors";
import countries from "@/constants/countries.json";
import type { CountryMap, TeamInfo } from "@/types/soccer/profile";
import { useSeason } from "@/hooks/football/useSeason";

const map: CountryMap = countries;

interface Props {
  teamInfo?: TeamInfo;
}

/**
 * Compact identity strip that sits above the tab bar and stays put across all
 * six tabs.
 *
 * It does NOT collapse on scroll. Each tab is a separate route with its own
 * scroll view, and two of the six are WebViews that emit no RN scroll events —
 * a collapsing header would either freeze at full height or need a 60fps
 * injectedJavaScript scroll bridge. Going horizontal at 48pt instead of the old
 * 120x120 centred crest buys back more space than collapsing would, for free.
 */
export default function TeamIdentityHeader({ teamInfo }: Props) {
  const { t } = useTranslation();
  const season = useSeason();
  const country = teamInfo?.team?.country;

  return (
    <View
      style={{
        backgroundColor: Colors.background.deepDark,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.default,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Image
        source={{ uri: teamInfo?.team?.logo }}
        style={{ width: 48, height: 48, marginEnd: 12 }}
        contentFit="contain"
      />

      <View className="flex-1">
        <Text
          className="text-[20px] font-bold"
          style={{ color: Colors.text.primary }}
          numberOfLines={1}
        >
          {teamInfo?.team?.name ?? ""}
        </Text>
        <View className="flex-row items-center gap-1.5 mt-0.5">
          {country && map[country] ? (
            <CountryFlag isoCode={map[country]} size={12} />
          ) : null}
          <Text
            className="text-[12px]"
            style={{ color: Colors.text.tertiary }}
            numberOfLines={1}
          >
            {[country, teamInfo?.team?.founded ? t("team.founded") + " " + teamInfo.team.founded : null]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>
      </View>

      {/* Sofascore puts a follower count here. We have no followers data, and a
          fabricated social metric is worse than none — the season pill fills the
          same slot with something every tab below actually depends on. */}
      <View
        style={{
          backgroundColor: Colors.background.card,
          borderRadius: 12,
          height: 24,
          paddingHorizontal: 10,
          justifyContent: "center",
          marginStart: 8,
        }}
      >
        <Text
          className="text-[11px] font-semibold"
          style={{ color: Colors.text.secondary, writingDirection: "ltr" }}
        >
          {`${season}/${String(season + 1).slice(-2)}`}
        </Text>
      </View>
    </View>
  );
}
