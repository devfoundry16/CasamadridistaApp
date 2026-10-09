import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { Text } from "@/components/Text";
import Touchable from "@/components/Touchable";
import Colors from "@/constants/colors";

interface Props {
  rank: number;
  /** A player photo, or a club crest on the Teams view. */
  imageUri: string | null;
  name: string;
  /** The club, or "vs Barcelona" on a single-match board. */
  subtitle?: string | null;
  /** GK / DEF / MID / FWD, translated. */
  badge?: string | null;
  value: string;
  /** "min", "per 90": shown under the value when the number alone would be unclear. */
  unit?: string | null;
  /** Our own club, marked rather than filtered. */
  highlight?: boolean;
  /** Absent when there is nowhere to go: another club's player has no screen. */
  onPress?: () => void;
}

/** One ranking row: rank, photo, name, club, position, value and unit. */
export default function LeaderRow({ rank, imageUri, name, subtitle, badge, value, unit, highlight, onPress }: Props) {
  const label = [String(rank), name, subtitle, badge, unit ? `${value} ${unit}` : value].filter(Boolean).join(", ");
  return (
    <Touchable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        minHeight: 56,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: pressed && onPress ? Colors.background.light : "transparent",
        borderStartWidth: highlight ? 3 : 0,
        borderStartColor: Colors.darkGold,
      })}
    >
      <Text
        className="text-[12px] font-semibold"
        style={{ color: Colors.text.muted, width: 26, textAlign: "center", fontVariant: ["tabular-nums"] }}
      >
        {rank}
      </Text>
      <Image
        source={imageUri ? { uri: imageUri } : null}
        style={{ width: 32, height: 32, borderRadius: 16, marginEnd: 10, backgroundColor: Colors.background.light }}
        contentFit="cover"
      />
      <View className="flex-1" style={{ marginEnd: 8 }}>
        <Text className="text-[14px] font-semibold" style={{ color: Colors.text.primary }} numberOfLines={1}>
          {name}
        </Text>
        {subtitle || badge ? (
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
            {badge ? (
              <View
                style={{
                  paddingHorizontal: 5,
                  borderRadius: 4,
                  marginEnd: 6,
                  backgroundColor: Colors.background.light,
                }}
              >
                <Text className="text-[10px] font-bold" style={{ color: Colors.text.secondary }}>
                  {badge}
                </Text>
              </View>
            ) : null}
            {subtitle ? (
              <Text className="text-[11px] flex-shrink" style={{ color: Colors.text.tertiary }} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text className="text-[17px] font-bold" style={{ color: Colors.darkGold, fontVariant: ["tabular-nums"] }}>
          {value}
        </Text>
        {unit ? (
          <Text className="text-[10px]" style={{ color: Colors.text.muted }}>
            {unit}
          </Text>
        ) : null}
      </View>
    </Touchable>
  );
}

/** The 1px rule between rows, inset like the rest of the Team tab. */
export function RowDivider() {
  return <View style={{ height: 1, backgroundColor: Colors.border.default, marginHorizontal: 14 }} />;
}
