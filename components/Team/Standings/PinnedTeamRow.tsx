import React from "react";
import { View } from "react-native";
import Colors from "@/constants/colors";
import type { StandingRow } from "@/types/soccer/standings";
import StandingsRow from "./StandingsRow";
import { STANDINGS_LAYOUT as L } from "./layout";
import type { PinEdge } from "./usePinnedTeamRow";

interface Props {
  row: StandingRow;
  rank: number;
  played: number;
  goalsDiff: number;
  points: number;
  pin: PinEdge;
  onPress: () => void;
  accessibilityLabel: string;
}

/**
 * Real Madrid's row, floating at whichever edge it disappeared past.
 *
 * The screen is about one club out of twenty, so the row the user came for
 * should never be off screen. Tapping it scrolls back to the real row.
 *
 * It renders the same StandingsRow component as the table, which is what
 * guarantees the columns line up with the rows behind it — a bespoke "summary
 * bar" would drift the first time a width changed.
 *
 * Opaque fill and a lighter border rather than a shadow: SurfaceCard's comment
 * rules shadows out, and content must not read through this.
 */
export default function PinnedTeamRow({
  row,
  rank,
  played,
  goalsDiff,
  points,
  pin,
  onPress,
  accessibilityLabel,
}: Props) {
  if (!pin) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        start: L.outerPadding,
        end: L.outerPadding,
        top: pin === "top" ? 0 : undefined,
        bottom: pin === "bottom" ? 8 : undefined,
      }}
    >
      <View
        style={{
          backgroundColor: Colors.background.card,
          borderRadius: 12,
          borderWidth: 1,
          // Gold, not border.light. With a neutral border this reads as one
          // more table row appended to the band behind it, which would imply
          // Madrid sits at that position. The gold edge marks it as the
          // followed team's row floating over the table, and ties it to the
          // gold rail inside.
          borderColor: "rgba(188,144,69,0.55)",
          overflow: "hidden",
        }}
      >
        <StandingsRow
          row={row}
          rank={rank}
          played={played}
          goalsDiff={goalsDiff}
          points={points}
          zoneColor="transparent"
          isOwnTeam
          pinned
          onPress={onPress}
          accessibilityLabel={accessibilityLabel}
        />
      </View>
    </View>
  );
}
