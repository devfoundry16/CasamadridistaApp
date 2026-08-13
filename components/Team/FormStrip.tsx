import React from "react";
import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/Text";
import Colors from "@/constants/colors";
import type { Match } from "@/types/soccer/match";
import ResultPill from "./ResultPill";
import { goalsFor, kickoff, opponentOf, outcomeFor } from "./matchUtils";

interface Props {
  /** Oldest first. Do NOT reverse for RTL — RN mirrors the row, and reversing
   *  as well would double-flip it back to LTR chronology. */
  matches: Match[];
  teamId: number;
}

const A11Y_OUTCOME = {
  win: "team.a11yWin",
  draw: "team.a11yDraw",
  loss: "team.a11yLoss",
  scheduled: "team.a11yDraw",
} as const;

export default function FormStrip({ matches, teamId }: Props) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View
      className="flex-row justify-between"
      accessibilityLabel={t("team.a11yFormStrip")}
    >
      {matches.map((m) => {
        const opponent = opponentOf(m, teamId);
        const outcome = outcomeFor(m, teamId);
        const { own, other } = goalsFor(m, teamId);
        const d = kickoff(m);

        return (
          <Pressable
            key={m.fixture.id}
            onPress={() => router.push(`/match/${m.fixture.id}` as never)}
            accessibilityRole="button"
            accessibilityLabel={`${t("team.a11yResult", {
              home: opponent.name,
              homeGoals: other ?? 0,
              away: t("nav.realMadridTeam"),
              awayGoals: own ?? 0,
            })}, ${t(A11Y_OUTCOME[outcome])}`}
            style={({ pressed }) => ({ alignItems: "center", opacity: pressed ? 0.7 : 1 })}
          >
            <Text
              className="text-[11px] mb-1.5"
              style={{ color: Colors.text.tertiary, writingDirection: "ltr" }}
            >
              {`${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`}
            </Text>
            <Image
              source={{ uri: opponent.logo }}
              style={{ width: 28, height: 28, marginBottom: 6 }}
              contentFit="contain"
            />
            <ResultPill home={own} away={other} outcome={outcome} size="sm" />
          </Pressable>
        );
      })}
    </View>
  );
}
