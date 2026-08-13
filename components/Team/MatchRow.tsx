import React from "react";
import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/Text";
import Colors from "@/constants/colors";
import type { Match } from "@/types/soccer/match";
import ResultPill from "./ResultPill";
import { goalsFor, isHome, kickoff, opponentOf, outcomeFor } from "./matchUtils";

export default function MatchRow({ match, teamId }: { match: Match; teamId: number }) {
  const { t } = useTranslation();
  const router = useRouter();

  const opponent = opponentOf(match, teamId);
  const outcome = outcomeFor(match, teamId);
  const { own, other } = goalsFor(match, teamId);
  const d = kickoff(match);
  const home = isHome(match, teamId);

  return (
    <Pressable
      onPress={() => router.push(`/match/${match.fixture.id}` as never)}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        height: 64,
        paddingHorizontal: 14,
        backgroundColor: pressed ? Colors.background.light : "transparent",
      })}
    >
      <View style={{ width: 52 }}>
        <Text
          className="text-[12px] font-semibold"
          style={{ color: Colors.text.secondary, writingDirection: "ltr" }}
        >
          {d.toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
        </Text>
        <Text
          className="text-[11px] mt-0.5"
          style={{ color: Colors.text.tertiary, writingDirection: "ltr" }}
        >
          {d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>

      <Image
        source={{ uri: opponent.logo }}
        style={{ width: 24, height: 24, marginStart: 8, marginEnd: 10 }}
        contentFit="contain"
      />

      <Text
        className="text-[14px] font-semibold flex-1"
        style={{ color: Colors.text.primary }}
        numberOfLines={1}
      >
        {opponent.name}
      </Text>

      <Text
        className="text-[11px] font-semibold"
        style={{ color: Colors.text.muted, marginEnd: 10 }}
      >
        {home ? t("team.homeShort") : t("team.awayShort")}
      </Text>

      <ResultPill home={own} away={other} outcome={outcome} size="sm" />
    </Pressable>
  );
}
