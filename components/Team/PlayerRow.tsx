import React from "react";
import { I18nManager, Pressable, View } from "react-native";
import { Image } from "expo-image";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Text } from "@/components/Text";
import Colors from "@/constants/colors";
import countries from "@/constants/countries.json";
import CountryFlag from "react-native-country-flag";
import type { Coach, CountryMap, Player } from "@/types/soccer/profile";

const map: CountryMap = countries;

export type SquadMetric = "general" | "age" | "height";

interface Props {
  player: Player | Coach;
  onPress: () => void;
  /** Which trailing value to show. Coach rows have no shirt number. */
  metric?: SquadMetric;
  variant?: "player" | "coach";
}

/**
 * Replaces the PlayerCard that was duplicated verbatim in both
 * app/(tabs)/team.tsx and app/team/[id].tsx.
 *
 * Changes from the original: shirt number 25px -> 17px (it overpowered the
 * 16px name), photo 60 -> 44 (an 84pt row becomes 64pt), and logical
 * margins so the row mirrors correctly under RTL.
 */
export default function PlayerRow({
  player,
  onPress,
  metric = "general",
  variant = "player",
}: Props) {
  const Chevron = I18nManager.isRTL ? ChevronLeft : ChevronRight;

  const trailing =
    metric === "age"
      ? player.age != null
        ? String(player.age)
        : "–"
      : metric === "height"
        ? player.height || "–"
        : player.age != null
          ? String(player.age)
          : "–";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={player.name}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        height: variant === "coach" ? 72 : 64,
        paddingHorizontal: 14,
        backgroundColor: pressed ? Colors.background.light : "transparent",
      })}
    >
      {variant === "player" ? (
        <View style={{ width: 28, alignItems: "center" }}>
          <Text
            className="text-[17px] font-bold"
            style={{ color: Colors.darkGold }}
            maxFontSizeMultiplier={1.2}
          >
            {player.number ?? ""}
          </Text>
        </View>
      ) : null}

      <Image
        source={{ uri: player.photo }}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          marginStart: variant === "player" ? 10 : 0,
          marginEnd: 12,
          borderWidth: 1,
          borderColor: Colors.border.default,
          backgroundColor: Colors.background.light,
        }}
        contentFit="cover"
      />

      <View className="flex-1 justify-center">
        <Text
          className="text-[15px] font-semibold"
          style={{ color: Colors.text.primary }}
          numberOfLines={1}
        >
          {player.name}
        </Text>
        <View className="flex-row items-center gap-1.5 mt-0.5">
          {player.nationality && map[player.nationality] ? (
            <CountryFlag isoCode={map[player.nationality]} size={12} />
          ) : null}
          <Text className="text-[12px]" style={{ color: Colors.text.tertiary }}>
            {player.nationality}
          </Text>
        </View>
      </View>

      {variant === "player" ? (
        <Text
          className="text-[14px] font-semibold"
          style={{ color: Colors.text.secondary, marginEnd: 8 }}
        >
          {trailing}
        </Text>
      ) : null}

      <Chevron size={18} color={Colors.text.muted} />
    </Pressable>
  );
}
