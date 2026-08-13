import React from "react";
import { View, type ViewProps } from "react-native";
import Colors from "@/constants/colors";

interface Props extends ViewProps {
  children: React.ReactNode;
  /** Set false for row lists, which own their own vertical padding. */
  padded?: boolean;
}

/**
 * The single card recipe for the team page.
 *
 * The 1px border is load-bearing, not decorative: card (#2F2F2F) on page
 * (#1A1A1A) is only a 1.30:1 step, so without the border the card edge is
 * invisible. Do not drop it "to look cleaner". Deliberately no shadow.
 */
export default function SurfaceCard({ children, padded = true, style, ...rest }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: Colors.background.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: Colors.border.default,
          overflow: "hidden",
          padding: padded ? 16 : 0,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
