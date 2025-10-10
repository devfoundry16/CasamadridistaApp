// components/TeamForm.tsx
import Colors from "@/constants/colors";
import { Match } from "@/types/soccer/match";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 2,
  },
  badge: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    textAlign: 'center',
  },
  win: { backgroundColor: "#28a745" },
  draw: { backgroundColor: "#f59e0b" },
  loss: { backgroundColor: "#ef4444" },
});

interface TeamFormProps {
  matches: Match[];
  nextMatchTeamId?: number;
  isHome?: boolean;
}

export default function TeamForm({ matches, nextMatchTeamId, isHome }: TeamFormProps) {
  const getOutcome = (match: Match) => {
    const homeGoals = match.goals.home;
    const awayGoals = match.goals.away;
    const sameSide = nextMatchTeamId === match.teams.home.id;
    const win = sameSide ? homeGoals > awayGoals : homeGoals < awayGoals;
    const draw = homeGoals === awayGoals;
    const loss = sameSide ? homeGoals < awayGoals : homeGoals > awayGoals;
    return win ? "W" : draw ? "D" : "L";
  };

  const getBadgeStyle = (match: Match) => {
    const result = getOutcome(match);
    if (result === "W") return styles.win;
    if (result === "D") return styles.draw;
    return styles.loss;
  };

  return (
    <View style={styles.container}>
      {matches?.map((match, idx) => (
        <View key={idx} style={[styles.badge, getBadgeStyle(match)]}>
          <Text style={styles.text}>{getOutcome(match)}</Text>
        </View>
      ))}
    </View>
  );
}
