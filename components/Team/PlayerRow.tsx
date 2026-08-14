import React from "react";
import { I18nManager, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Text } from "@/components/Text";
import Touchable from "@/components/Touchable";
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
 * One squad row: number · photo · name · nationality · metric.
 *
 * Everything sits on a single 56pt line. An earlier version stacked the name
 * over the nationality, which left the right two thirds of a 393pt screen
 * empty; laying the four fields out horizontally uses the width and lets the
 * eye scan one column at a time down the list.
 *
 * Widths: the name gets `flex: 1` and the nationality `flexShrink: 1`, so a
 * long name pushes the country label to ellipsis before the name itself
 * truncates — the name is the field people scan for.
 */
export default function PlayerRow({
  player,
  onPress,
  metric = "general",
  variant = "player",
}: Props) {
  const Chevron = I18nManager.isRTL ? ChevronLeft : ChevronRight;
  const isPlayer = variant === "player";

  const trailing =
    metric === "height"
      ? player.height || "–"
      : player.age != null
        ? String(player.age)
        : "–";

  const isoCode = player.nationality ? map[player.nationality] : undefined;

  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={player.name}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: Colors.background.light },
      ]}
    >
      {isPlayer ? (
        <Text style={styles.number} maxFontSizeMultiplier={1.2}>
          {player.number ?? ""}
        </Text>
      ) : null}

      <Image
        source={{ uri: player.photo }}
        style={[styles.photo, isPlayer && { marginStart: 8 }]}
        contentFit="cover"
      />

      <Text style={styles.name} numberOfLines={1}>
        {player.name}
      </Text>

      {player.nationality ? (
        <View style={styles.country}>
          {isoCode ? <CountryFlag isoCode={isoCode} size={13} /> : null}
          <Text style={styles.countryLabel} numberOfLines={1}>
            {player.nationality}
          </Text>
        </View>
      ) : null}

      {isPlayer ? (
        <Text style={styles.metric} numberOfLines={1} maxFontSizeMultiplier={1.2}>
          {trailing}
        </Text>
      ) : null}

      <Chevron size={16} color={Colors.text.muted} style={styles.chevron} />
    </Touchable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    paddingHorizontal: 14,
  },
  number: {
    width: 24,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: Colors.darkGold,
    fontVariant: ["tabular-nums"],
  },
  photo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginEnd: 12,
    borderWidth: 1,
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.light,
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  country: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    marginStart: 10,
  },
  countryLabel: {
    marginStart: 6,
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  metric: {
    minWidth: 34,
    marginStart: 10,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.secondary,
    fontVariant: ["tabular-nums"],
  },
  chevron: {
    marginStart: 4,
  },
});
