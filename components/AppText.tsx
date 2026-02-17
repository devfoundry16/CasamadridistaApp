
/**
 * App-wide Text that applies Cairo font when the app language is Arabic.
 * Use via: import { Text } from "@/components/Text";
 */
import React from "react";
import { StyleSheet, Text, TextProps, TextStyle } from "react-native";
import { useFont } from "@/contexts/FontContext";

function isBoldWeight(fontWeight: TextStyle["fontWeight"]): boolean {
  return (
    fontWeight === "bold" ||
    fontWeight === "600" ||
    fontWeight === "700" ||
    fontWeight === "800" ||
    fontWeight === "900" ||
    (typeof fontWeight === "number" && fontWeight >= 600)
  );
}

const BOLD_CLASS_PATTERN = /\bfont-(semibold|bold|extrabold|black)\b/;

export function AppText({
  style,
  className,
  ...props
}: TextProps) {
  const { fontFamily, fontFamilyBold } = useFont();
  const flattened = StyleSheet.flatten(style ?? {});
  const fontWeight = flattened?.fontWeight;
  const boldFromStyle = fontWeight !== undefined && isBoldWeight(fontWeight);
  const boldFromClassName =
    typeof className === "string" && BOLD_CLASS_PATTERN.test(className);
  const useBoldFont = boldFromStyle || boldFromClassName;
  const fontToApply = (useBoldFont ? fontFamilyBold : fontFamily) ?? undefined;
  const fontStyleOverride = fontToApply
    ? {
        fontFamily: fontToApply,
        // Prevent RN/nativewind fontWeight from overriding custom Cairo family.
        fontWeight: "normal" as const,
      }
    : undefined;

  return (
    <Text
      {...props}
      className={className}
      style={[style, fontStyleOverride]}
    />
  );
}
