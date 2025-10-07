import Colors from "@/constants/colors";
import { Match } from "@/interfaces/match";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import TeamForm from "./TeamForm";
interface UpcomingProps {
  nextMatch: Match;
  homeTeamLastMatches: Match[];
  awayTeamLastMatches: Match[];
  timeLeft: {
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
  };
}

export default function UpcomingForm({
  nextMatch,
  homeTeamLastMatches,
  awayTeamLastMatches,
  timeLeft,
}: UpcomingProps) {
  const router = useRouter();
  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.leagueText}>
        {nextMatch?.league.name} {nextMatch?.league.season}-
        {nextMatch?.league.season + 1} | {nextMatch?.league.round}
      </Text>
      <Text style={styles.venueText}>
        {nextMatch?.fixture.venue.name} |{" "}
        {new Date(nextMatch?.fixture.date).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>

      {/* Teams */}
      <View style={styles.teamsContainer}>
        {/* Home Team */}
        <TouchableOpacity
          style={styles.teamBox}
          onPress={() => router.push(`/team/${nextMatch.teams.home.id}`)}
        >
          <Image
            source={{ uri: nextMatch?.teams.home.logo }}
            style={styles.logo}
          />
          <Text style={styles.teamName}>{nextMatch?.teams.home.name}</Text>

          <TeamForm
            matches={homeTeamLastMatches ?? []}
            nextMatchTeamId={nextMatch?.teams.home.id}
            isHome
          />
        </TouchableOpacity>

        {/* Away Team */}
        <TouchableOpacity
          style={styles.teamBox}
          onPress={() => router.push(`/team/${nextMatch.teams.away.id}`)}
        >
          <Image
            source={{ uri: nextMatch?.teams.away.logo }}
            style={styles.logo}
          />
          <Text style={styles.teamName}>{nextMatch?.teams.away.name}</Text>
          <TeamForm
            matches={awayTeamLastMatches ?? []}
            nextMatchTeamId={nextMatch?.teams.away.id}
          />
        </TouchableOpacity>
      </View>

      {/* Countdown */}
      <View style={styles.timerRow}>
        {Object.entries(timeLeft).map(([label, value], i) => (
          <View key={i} style={styles.timerCircle}>
            <View style={styles.timerInner}>
              <Text style={styles.timerValue}>{value}</Text>
              <Text style={styles.timerLabel}>{label}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Prediction */}
      <Text style={styles.prediction}>
        Prediction:{" "}
        <Text style={styles.predictionHighlight}>
          Double chance : draw or Real Madrid
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(27, 27, 27, 0.5)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  leagueText: {
    color: Colors.textWhite,
    fontSize: 13,
    textAlign: "center",
  },
  venueText: {
    color: Colors.textWhite,
    fontSize: 11,
    textAlign: "center",
    marginBottom: 10,
  },
  teamsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  teamBox: {
    alignItems: "center",
    flex: 1,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    marginBottom: 4,
  },
  teamName: {
    color: Colors.textWhite,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  formRow: {
    flexDirection: "row",
    gap: 4,
  },
  formBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  formText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textWhite,
  },
  formWin: { backgroundColor: "#16a34a" },
  formDraw: { backgroundColor: "#facc15" },
  formLoss: { backgroundColor: "#dc2626" },
  timerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginBottom: 10,
  },
  timerCircle: {
    borderColor: "#16a34a",
    borderWidth: 2,
    borderRadius: 50,
    padding: 6,
  },
  timerInner: {
    backgroundColor: "transparent",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  timerValue: {
    color: Colors.textWhite,
    fontSize: 20,
    fontWeight: "bold",
  },
  timerLabel: {
    color: Colors.textWhite,
    fontSize: 10,
    textTransform: "uppercase",
  },
  prediction: {
    color: Colors.textWhite,
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
  },
  predictionHighlight: {
    color: Colors.textWhite,
    fontWeight: "600",
  },
});
