import React from "react";
import { View } from "react-native";
import { Text } from "@/components/Text";
import Colors from "@/constants/colors";

const FILL: Record<string, string> = {
  W: Colors.status.success,
  D: Colors.status.warning,
  L: Colors.status.error,
};

/**
 * The last five results as W/D/L squares.
 *
 * FormStrip can't be reused — it takes Match[] and renders crests and scores;
 * all we have here is a letter string.
 *
 * The string is rendered oldest -> newest exactly as it arrives, NOT reversed.
 * React Native already mirrors a `flexDirection: "row"` under RTL, so reversing
 * it here would double-flip and put the newest result on the wrong end. Same
 * trap FormStrip's comment documents.
 *
 * `form` is shorter than five early in a season ("WW" right now) and can exceed
 * five later, so slice rather than assume.
 */
export default function FormPills({ form }: { form: string | null }) {
  const letters = (form ?? "").replace(/[^WDL]/gi, "").toUpperCase().slice(-5).split("");
  if (letters.length === 0) return null;

  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {letters.map((letter, i) => (
        <View
          key={`${letter}-${i}`}
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: FILL[letter] ?? Colors.background.light,
          }}
        >
          <Text
            className="text-[10px] font-bold"
            // Dark ink on a colour fill — white fails AA on all three. Same
            // rule ResultPill states.
            style={{ color: Colors.background.dark }}
            maxFontSizeMultiplier={1.1}
          >
            {letter}
          </Text>
        </View>
      ))}
    </View>
  );
}
