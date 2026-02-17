import Colors from "@/constants/colors";
import { Match } from "@/types/soccer/match";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/Text";
import { Image, TouchableOpacity, View } from "react-native";
import { Circle } from "react-native-progress";

import TeamForm from "./TeamForm";
interface UpcomingProps {
  setLive: React.Dispatch<React.SetStateAction<boolean>>;
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
  setLive,
  nextMatch,
  homeTeamLastMatches,
  awayTeamLastMatches,
}: UpcomingProps) {
  const router = useRouter();
  const { i18n } = useTranslation();
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

  const live = nextMatch.goals.home == null ? false : true;
  const formatMatchDate = (date: string | Date) =>
    new Date(date).toLocaleDateString(i18n.language.startsWith("ar") ? "ar-SA" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
        setLive(false);
      } else {
        setLive(true);
        setTimeLeft({ days: "0", hours: "0", minutes: "0", seconds: "0" });
      }
    };
    if (!live) {
      calculateTimeLeft();
      const timer = setInterval(calculateTimeLeft, 1000);
      return () => clearInterval(timer);
    }
  }, [nextMatch, live, setLive]);

  return (
    <View className="bg-bg-medium/50 rounded-2xl p-4 items-center justify-center">
      {/* Header */}
      <Text className="text-text-primary text-[13px] text-center">
        {nextMatch?.league.name} {nextMatch?.league.season}-
        {nextMatch?.league.season + 1} | {nextMatch?.league.round}
      </Text>
      <TouchableOpacity
        onPress={() => router.push(`/venue/${nextMatch?.fixture.venue.id}`)}
      >
        <Text className="text-text-primary text-[11px] text-center mb-2.5">
          {nextMatch?.fixture.venue.name} |{" "}
          {formatMatchDate(nextMatch?.fixture.date)}
        </Text>
      </TouchableOpacity>

      {/* Teams */}
      <View className="flex-row justify-between w-full mb-5">
        {/* Home Team */}
        <TouchableOpacity
          className="items-center flex-1"
          onPress={() => router.push(`/team/${nextMatch.teams.home.id}`)}
        >
          <Image
            source={{ uri: nextMatch?.teams.home.logo }}
            style={{ width: 60, height: 60 }}
            className="mb-1"
            resizeMode="contain"
          />
          <Text className="text-text-primary text-sm font-bold mb-1.5">{nextMatch?.teams.home.name}</Text>
          <TeamForm
            matches={homeTeamLastMatches ?? []}
            nextMatchTeamId={nextMatch?.teams.home.id}
            isHome
          />
        </TouchableOpacity>
        {live && (
          <View className="flex-row items-center">
            <Text className="text-text-primary text-2xl font-bold mx-1.5">
              {nextMatch.goals.home == null ? "0" : nextMatch.goals.home}
            </Text>
            <Text className="text-text-primary text-2xl font-bold mx-1.5">:</Text>
            <Text className="text-text-primary text-2xl font-bold mx-1.5">
              {nextMatch.goals.away == null ? "0" : nextMatch.goals.away}
            </Text>
          </View>
        )}
        {/* Away Team */}
        <TouchableOpacity
          className="items-center flex-1"
          onPress={() => router.push(`/team/${nextMatch.teams.away.id}`)}
        >
          <Image
            source={{ uri: nextMatch?.teams.away.logo }}
            style={{ width: 60, height: 60 }}
            className="mb-1"
            resizeMode="contain"
          />
          <Text className="text-text-primary text-sm font-bold mb-1.5">{nextMatch?.teams.away.name}</Text>
          <TeamForm
            matches={awayTeamLastMatches ?? []}
            nextMatchTeamId={nextMatch?.teams.away.id}
          />
        </TouchableOpacity>
      </View>

      {/* Countdown */}
      {!live && (
        <View className="flex-row justify-around items-center gap-0.5">
          {Object.entries(timeLeft).map(([label, value], i) => (
            <View key={i}>
              {((i < 3 && value !== "00") || i === 3) && (
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
    <View className="items-center">
      <Text className="mb-0.5 text-xs text-text-primary font-medium">{label}</Text>
      <Circle
        progress={progress}
        size={60}
        thickness={4}
        color={color}
        unfilledColor="#E0E0E0"
        borderWidth={0}
        showsText={true}
        formatText={() => value}
        textStyle={{ fontSize: 18, fontWeight: "600", color: Colors.textWhite }}
      />
    </View>
  );
};
