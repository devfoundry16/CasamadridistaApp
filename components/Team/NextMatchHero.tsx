import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/Text";
import Colors from "@/constants/colors";
import type { Match } from "@/types/soccer/match";
import { isInPlay, kickoff } from "./matchUtils";

interface Props {
  match: Match;
  /** Crest ghosted behind the card. */
  watermarkUri?: string;
}

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function useCountdown(target: Date, active: boolean) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // Gated on focus: material-top-tabs has no freezeOnBlur, so an ungated
    // interval keeps ticking while the user is on another tab.
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  const ms = target.getTime() - now;
  const totalSeconds = Math.floor(ms / 1000);
  return {
    expired: ms <= 0,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ alignItems: "center", minWidth: 40 }}>
      <Text
        className="text-[28px] font-bold"
        style={{
          color: Colors.darkGold,
          fontVariant: ["tabular-nums"],
          writingDirection: "ltr",
        }}
        maxFontSizeMultiplier={1.2}
      >
        {value}
      </Text>
      <Text className="text-[10px] font-semibold mt-0.5" style={{ color: Colors.text.tertiary }}>
        {label}
      </Text>
    </View>
  );
}

/**
 * The signature element of the team page.
 *
 * Everything else here is a flat #2F2F2F rectangle with a #3A3A3A hairline.
 * This is the only component that gets a gradient, a watermark, a gold border
 * and 28px numerals — because "when do we play, and are we winning right now"
 * is the one question a Madridista opens this app to ask.
 *
 * No animation on purpose: a shimmer or pulsing border would turn the one
 * deliberate flourish on the page into decoration.
 */
export default function NextMatchHero({ match, watermarkUri }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const focused = useIsFocused();

  const date = kickoff(match);
  const live = isInPlay(match);
  const { days, hours, minutes, seconds, expired } = useCountdown(date, focused && !live);

  const showScore = live || expired;

  return (
    <Pressable
      onPress={() => router.push(`/match/${match.fixture.id}` as never)}
      accessibilityRole="button"
      style={({ pressed }) => ({
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(188,144,69,0.35)",
        backgroundColor: Colors.background.deepDark,
        overflow: "hidden",
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <LinearGradient
        colors={["rgba(188,144,69,0.14)", "transparent"]}
        locations={[0, 0.6]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {watermarkUri ? (
        <Image
          source={{ uri: watermarkUri }}
          style={{
            position: "absolute",
            width: 200,
            height: 200,
            end: -48,
            top: -24,
            opacity: 0.06,
          }}
          contentFit="contain"
          pointerEvents="none"
        />
      ) : null}

      <View style={{ padding: 16 }}>
        <Text
          className="text-[11px] font-bold"
          style={{ color: Colors.darkGold }}
          numberOfLines={1}
        >
          {match.league?.name}
        </Text>

        <View className="flex-row items-center justify-between mt-4">
          <View style={{ flex: 1, alignItems: "center" }}>
            <Image
              source={{ uri: match.teams.home.logo }}
              style={{ width: 52, height: 52 }}
              contentFit="contain"
            />
            <Text
              className="text-[12px] mt-1.5 text-center"
              style={{ color: Colors.text.secondary }}
              numberOfLines={1}
            >
              {match.teams.home.name}
            </Text>
          </View>

          <View style={{ paddingHorizontal: 8, alignItems: "center" }}>
            {showScore ? (
              <>
                <View className="flex-row items-center">
                  <Text
                    className="text-[32px] font-bold"
                    style={{ color: Colors.text.primary, fontVariant: ["tabular-nums"] }}
                  >
                    {match.goals?.home ?? 0}
                  </Text>
                  <Text
                    className="text-[32px] font-bold"
                    style={{ color: Colors.text.primary, marginHorizontal: 6 }}
                  >
                    –
                  </Text>
                  <Text
                    className="text-[32px] font-bold"
                    style={{ color: Colors.text.primary, fontVariant: ["tabular-nums"] }}
                  >
                    {match.goals?.away ?? 0}
                  </Text>
                </View>
                {live ? (
                  <View className="flex-row items-center gap-1.5 mt-1">
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: Colors.status.error,
                      }}
                    />
                    <Text
                      className="text-[11px] font-bold"
                      style={{ color: Colors.status.error }}
                    >
                      {match.fixture.status.elapsed
                        ? `${match.fixture.status.elapsed}'`
                        : t("team.liveNow")}
                    </Text>
                  </View>
                ) : null}
              </>
            ) : (
              <View className="flex-row items-start gap-1.5">
                <Unit value={pad(days)} label={t("team.unitDays")} />
                <Unit value={pad(hours)} label={t("team.unitHours")} />
                <Unit value={pad(minutes)} label={t("team.unitMinutes")} />
                <Unit value={pad(seconds)} label={t("team.unitSeconds")} />
              </View>
            )}
          </View>

          <View style={{ flex: 1, alignItems: "center" }}>
            <Image
              source={{ uri: match.teams.away.logo }}
              style={{ width: 52, height: 52 }}
              contentFit="contain"
            />
            <Text
              className="text-[12px] mt-1.5 text-center"
              style={{ color: Colors.text.secondary }}
              numberOfLines={1}
            >
              {match.teams.away.name}
            </Text>
          </View>
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: "rgba(188,144,69,0.20)",
            marginTop: 16,
            marginBottom: 10,
          }}
        />
        <Text
          className="text-[12px] text-center"
          style={{ color: Colors.text.secondary }}
          numberOfLines={1}
        >
          {[
            date.toLocaleDateString(undefined, {
              weekday: "short",
              day: "2-digit",
              month: "short",
            }),
            date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
            match.fixture?.venue?.name,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </View>
    </Pressable>
  );
}
