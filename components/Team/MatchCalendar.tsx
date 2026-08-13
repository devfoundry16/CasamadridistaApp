import React, { useMemo } from "react";
import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Text } from "@/components/Text";
import Colors from "@/constants/colors";
import type { Match } from "@/types/soccer/match";
import ResultPill from "./ResultPill";
import SurfaceCard from "./SurfaceCard";
import { goalsFor, kickoff, opponentOf, outcomeFor } from "./matchUtils";

interface Props {
  matches: Match[];
  teamId: number;
  month: Date;
  onMonthChange: (next: Date) => void;
}

const CELL_H = 52;

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function MatchCalendar({ matches, teamId, month, onMonthChange }: Props) {
  const router = useRouter();
  const today = new Date();

  // Weekday initials in the active locale, starting Monday.
  const weekdayLabels = useMemo(() => {
    const base = new Date(2024, 0, 1); // a Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d.toLocaleDateString(undefined, { weekday: "narrow" });
    });
  }, []);

  const { cells, label } = useMemo(() => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const first = new Date(year, m, 1);
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    // Monday-first offset.
    const lead = (first.getDay() + 6) % 7;

    const out: ({ day: number; date: Date; match?: Match } | null)[] = [];
    for (let i = 0; i < lead; i++) out.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, m, day);
      const match = matches.find((x) => sameDay(kickoff(x), date));
      out.push({ day, date, match });
    }
    return {
      cells: out,
      label: month.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    };
  }, [month, matches]);

  const step = (delta: number) =>
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return (
    <SurfaceCard padded={false}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          height: 48,
          paddingHorizontal: 8,
        }}
      >
        <Pressable
          onPress={() => step(-1)}
          accessibilityRole="button"
          hitSlop={8}
          style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
        >
          {/* Physical chevrons: the calendar grid itself mirrors under RTL, and
              "previous" stays on the leading edge because the row mirrors too. */}
          <ChevronLeft size={20} color={Colors.text.secondary} />
        </Pressable>
        <Text
          className="text-[13px] font-bold flex-1 text-center"
          style={{ color: Colors.text.primary }}
        >
          {label}
        </Text>
        <Pressable
          onPress={() => step(1)}
          accessibilityRole="button"
          hitSlop={8}
          style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
        >
          <ChevronRight size={20} color={Colors.text.secondary} />
        </Pressable>
      </View>

      <View style={{ height: 1, backgroundColor: Colors.border.default }} />

      <View style={{ flexDirection: "row", paddingVertical: 8 }}>
        {weekdayLabels.map((w, i) => (
          <Text
            key={i}
            className="text-[11px] font-semibold text-center"
            style={{ flex: 1, color: Colors.text.muted }}
          >
            {w}
          </Text>
        ))}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", paddingBottom: 8 }}>
        {cells.map((cell, i) => {
          if (!cell) {
            return <View key={`pad-${i}`} style={{ width: `${100 / 7}%`, height: CELL_H }} />;
          }

          const { day, date, match } = cell;
          const isToday = sameDay(date, today);

          const content = (
            <View
              style={{
                flex: 1,
                margin: 2,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isToday ? Colors.background.light : "transparent",
                borderWidth: match ? 1 : 0,
                borderColor: Colors.darkGold,
              }}
            >
              <Text
                className="text-[11px]"
                style={{
                  color: match ? Colors.text.primary : Colors.text.tertiary,
                  fontWeight: match ? "700" : "400",
                }}
                maxFontSizeMultiplier={1.2}
              >
                {day}
              </Text>
              {match ? (
                <>
                  <Image
                    source={{ uri: opponentOf(match, teamId).logo }}
                    style={{ width: 16, height: 16, marginTop: 1 }}
                    contentFit="contain"
                  />
                  <View style={{ transform: [{ scale: 0.75 }], marginTop: -1 }}>
                    <ResultPill
                      home={goalsFor(match, teamId).own}
                      away={goalsFor(match, teamId).other}
                      outcome={outcomeFor(match, teamId)}
                      size="sm"
                    />
                  </View>
                </>
              ) : null}
            </View>
          );

          return (
            <View key={date.toISOString()} style={{ width: `${100 / 7}%`, height: CELL_H }}>
              {match ? (
                <Pressable
                  onPress={() => router.push(`/match/${match.fixture.id}` as never)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: true }}
                  style={{ flex: 1 }}
                >
                  {content}
                </Pressable>
              ) : (
                content
              )}
            </View>
          );
        })}
      </View>
    </SurfaceCard>
  );
}
