import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { Text } from "@/components/Text";
import Touchable from "@/components/Touchable";
import Colors from "@/constants/colors";
import type { StandingRow } from "@/types/soccer/standings";
import { STANDINGS_LAYOUT as L } from "./layout";

export interface StandingsRowProps {
  row: StandingRow;
  /** Displayed rank. Not row.rank — Home/Away scopes renumber from 1. */
  rank: number;
  played: number;
  goalsDiff: number;
  points: number;
  /** Rail colour for this row's band. "transparent" keeps columns aligned. */
  zoneColor: string;
  isOwnTeam: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  /** The floating copy: gold rail instead of a zone rail, no press feedback. */
  pinned?: boolean;
}

/**
 * One standings row.
 *
 * Real Madrid deliberately gets NO start rail, unlike LeaderRow in
 * top-players.tsx which marks it with `borderStartWidth: 3` gold. Here the
 * start edge belongs to the qualification zone, and a gold rail on top of it
 * would either hide the zone or read as a fourth zone colour. Madrid is marked
 * by the tint plus gold name and points instead.
 *
 * The pinned copy is the exception: it floats outside every band and so has no
 * zone to show, which is what frees its rail for gold.
 *
 * Do not "restore consistency" with top-players.tsx — it destroys the bands.
 */
function StandingsRow({
  row,
  rank,
  played,
  goalsDiff,
  points,
  zoneColor,
  isOwnTeam,
  onPress,
  accessibilityLabel,
  pinned = false,
}: StandingsRowProps) {
  const accent = isOwnTeam ? Colors.darkGold : undefined;

  return (
    <Touchable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? row.team.name}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          height: pinned ? L.pinnedHeight : L.rowHeight,
          paddingStart: L.rowPaddingH,
          paddingEnd: L.rowPaddingH,
          borderStartWidth: L.railWidth,
          borderStartColor: pinned ? Colors.darkGold : zoneColor,
        },
        isOwnTeam && !pinned && { backgroundColor: "rgba(188,144,69,0.12)" },
        pressed && !pinned && { backgroundColor: Colors.background.light },
      ]}
    >
      <Text
        className="text-[13px] font-semibold"
        style={{
          width: L.rankWidth,
          textAlign: "center",
          color: accent ?? Colors.text.tertiary,
          fontVariant: ["tabular-nums"],
          writingDirection: "ltr",
        }}
        maxFontSizeMultiplier={1.2}
      >
        {rank}
      </Text>

      <Image
        source={{ uri: row.team.logo }}
        style={{
          width: L.crestSize,
          height: L.crestSize,
          marginStart: L.crestGap,
          marginEnd: L.crestGap,
        }}
        contentFit="contain"
      />

      <Text
        className="text-[15px] font-semibold"
        style={{ flex: 1, color: accent ?? Colors.text.primary }}
        numberOfLines={1}
      >
        {row.team.name}
      </Text>

      <Stat width={L.colPlayed} value={String(played)} />
      {/* One token, not a score — a single Text, or the minus migrates in RTL. */}
      <Stat width={L.colDiff} value={goalsDiff > 0 ? `+${goalsDiff}` : String(goalsDiff)} />
      <Stat width={L.colPoints} value={String(points)} bold color={accent} />
    </Touchable>
  );
}

function Stat({
  width,
  value,
  bold = false,
  color,
}: {
  width: number;
  value: string;
  bold?: boolean;
  color?: string;
}) {
  return (
    <View style={{ width, marginStart: L.colGap }}>
      <Text
        className={bold ? "text-[15px] font-bold" : "text-[14px] font-semibold"}
        style={{
          textAlign: "center",
          color: color ?? (bold ? Colors.text.primary : Colors.text.secondary),
          fontVariant: ["tabular-nums"],
          writingDirection: "ltr",
        }}
        maxFontSizeMultiplier={1.2}
      >
        {value}
      </Text>
    </View>
  );
}

export default React.memo(StandingsRow);
