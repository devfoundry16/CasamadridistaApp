import Colors from "@/constants/colors";
import { Match } from "@/types/soccer/match";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Circle } from "react-native-progress";

import TeamForm from "./TeamForm";
interface UpcomingProps {
  liveMatch?: Match;
  nextMatch: Match;
  homeTeamLastMatches: Match[];
  awayTeamLastMatches: Match[];
}
type TimeLeft = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};
export default function UpcomingForm({
  nextMatch,
  homeTeamLastMatches,
  awayTeamLastMatches,
}: UpcomingProps) {
  const router = useRouter();
  const maxValues = [365, 24, 60, 60];
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: "0",
    hours: "0",
    minutes: "0",
    seconds: "0",
  });
  const formatTime = (
    days: number,
    hours: number,
    minutes: number,
    seconds: number
  ) => {
    const pad = (num: number) => String(num).padStart(2, "0");
    return {
      days: pad(days),
      hours: pad(hours),
      minutes: pad(minutes),
      seconds: pad(seconds),
    };
  };
  useEffect(() => {
    const calculateTimeLeft = async () => {
      const matchDateString: any = nextMatch?.fixture.date;
      const matchDateTime = new Date(matchDateString);
      const now = new Date();
      const difference = matchDateTime.getTime() - now.getTime();
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft(formatTime(days, hours, minutes, seconds));
      } else {
        setTimeLeft({ days: "0", hours: "0", minutes: "0", seconds: "0" });
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [nextMatch]);
  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.leagueText}>
        {nextMatch?.league.name} {nextMatch?.league.season}-
        {nextMatch?.league.season + 1} | {nextMatch?.league.round}
      </Text>
      <TouchableOpacity
        onPress={() => router.push(`/venue/${nextMatch?.fixture.venue.id}`)}
      >
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
      </TouchableOpacity>

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
        {nextMatch.goals.home != null && (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.teamScore}>
              {nextMatch.goals.home == null ? "0" : nextMatch.goals.home}
            </Text>
            <Text style={styles.teamScore}>:</Text>
            <Text style={styles.teamScore}>
              {nextMatch.goals.away == null ? "2" : nextMatch.goals.away}
            </Text>
          </View>
        )}
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
      {nextMatch.goals.home == null && (
        <View style={styles.timerRow}>
          {Object.entries(timeLeft).map(([label, value], i) => (
            <View key={i}>
              {((i < 3 && value != "00") || i == 3) && (
                <TimeCircle
                  label={label.toUpperCase()}
                  value={value}
                  max={maxValues[i]}
                  color="#4CAF50"
                />
              )}
            </View>
          ))}
        </View>
      )}

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

const TimeCircle = ({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: string;
  max: number;
  color: string;
}) => {
  const progress = max > 0 ? Number(value) / max : 0;
  return (
    <View style={styles.circleContainer}>
      <Text style={styles.label}>{label}</Text>
      <Circle
        progress={progress}
        size={60}
        thickness={4}
        color={color}
        unfilledColor="#E0E0E0"
        borderWidth={0}
        showsText={true}
        formatText={() => value}
        textStyle={styles.valueText}
      />
    </View>
  );
};

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
  teamScore: {
    color: Colors.textWhite,
    fontSize: 24,
    fontWeight: "700",
    marginHorizontal: 6,
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
  formWin: { backgroundColor: "#28a745" },
  formDraw: { backgroundColor: "#facc15" },
  formLoss: { backgroundColor: "#dc2626" },

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
  timerRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    gap: 2,
  },
  circleContainer: {
    alignItems: "center",
  },
  valueText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textWhite,
  },
  label: {
    marginBottom: 2,
    fontSize: 12,
    color: Colors.textWhite,
    fontWeight: "500",
  },
});
