import React from "react";
import { View } from "react-native";
import { Text } from "@/components/Text";
import Colors from "@/constants/colors";

export type Outcome = "win" | "draw" | "loss" | "scheduled";

const FILL: Record<Outcome, string> = {
  win: Colors.status.success,
  draw: Colors.status.warning,
  loss: Colors.status.error,
  scheduled: Colors.background.light,
};

interface Props {
  home: number | null;
  away: number | null;
  outcome: Outcome;
  size?: "sm" | "md";
}

/**
 * Score pill.
 *
 * Two deliberate details:
 *
 * 1. Ink is #0A0A0A on solid status fills, not white. White gives 2.54:1 on
 *    green, 2.15:1 on amber and 3.76:1 on red — all failing AA. Dark ink gives
 *    7.80 / 9.22 / 5.26.
 * 2. The score is THREE sibling Text nodes, never a joined "2 - 1" string. The
 *    bidi algorithm resolves the neutral dash by surrounding context, so a
 *    joined string renders inconsistently in Arabic. Three siblings in a
 *    flex-row mirror in lockstep with the crests around them.
 */
export default function ResultPill({ home, away, outcome, size = "md" }: Props) {
  const scheduled = outcome === "scheduled" || home == null || away == null;
  const ink = scheduled ? Colors.text.secondary : Colors.background.dark;
  const fontSize = size === "sm" ? 12 : 13;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        backgroundColor: FILL[scheduled ? "scheduled" : outcome],
        borderRadius: size === "sm" ? 8 : 12,
        paddingHorizontal: size === "sm" ? 8 : 10,
        paddingVertical: size === "sm" ? 3 : 5,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        minWidth: size === "sm" ? 44 : 52,
      }}
    >
      {scheduled ? (
        <Text style={{ color: ink, fontSize, fontWeight: "700" }}>–</Text>
      ) : (
        <>
          <Text
            maxFontSizeMultiplier={1.2}
            style={{ color: ink, fontSize, fontWeight: "700" }}
          >
            {home}
          </Text>
          <Text
            maxFontSizeMultiplier={1.2}
            style={{ color: ink, fontSize, fontWeight: "700", marginHorizontal: 3 }}
          >
            –
          </Text>
          <Text
            maxFontSizeMultiplier={1.2}
            style={{ color: ink, fontSize, fontWeight: "700" }}
          >
            {away}
          </Text>
        </>
      )}
    </View>
  );
}
