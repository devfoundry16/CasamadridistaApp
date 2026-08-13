// components/TeamForm.tsx
import { Match } from "@/types/soccer/match";
import React from "react";
import { Text } from "@/components/Text";
import { View } from "react-native";

const outcomeClassNames = {
  win: "bg-status-success",
  draw: "bg-status-warning",
  loss: "bg-status-error",
};

interface TeamFormProps {
  matches: Match[];
  nextMatchTeamId?: number;
  isHome?: boolean;
}

export default function TeamForm({ matches, nextMatchTeamId }: TeamFormProps) {
  const getOutcome = (match: Match) => {
    const homeGoals = match.goals.home;
    const awayGoals = match.goals.away;
    const sameSide = nextMatchTeamId === match.teams.home.id;
    const win = sameSide ? homeGoals > awayGoals : homeGoals < awayGoals;
    const draw = homeGoals === awayGoals;
    return win ? "win" : draw ? "draw" : "loss";
  };

  return (
    <View className="flex-row gap-0.5">
      {matches?.map((match, idx) => {
        const outcome = getOutcome(match);
        const displayText = outcome === "win" ? "W" : outcome === "draw" ? "D" : "L";
        return (
          <View
            key={idx}
            className={`w-[15px] h-[15px] rounded-full justify-center justify-self-center items-center ${outcomeClassNames[outcome]}`}
          >
            {/* Dark ink, not white: white on these fills is 2.54:1 (green),
                2.15:1 (amber) and 3.76:1 (red) — all failing AA. #0A0A0A gives
                7.80 / 9.22 / 5.26. */}
            <Text
              className="text-[11px] leading-[11px] text-center font-bold text-bg-dark"
              style={{ includeFontPadding: false }}
            >
              {displayText}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
