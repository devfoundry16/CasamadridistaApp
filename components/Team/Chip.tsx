import React from "react";
import { Pressable } from "react-native";
import { Text } from "@/components/Text";
import Colors from "@/constants/colors";

interface Props {
  label: string;
  active: boolean;
  onPress: () => void;
}

/**
 * Selection chip. The active fill is neutral (#3A3A3A), not gold — gold is
 * spent once on the Details hero, and gold text on #3A3A3A is 3.91:1 anyway.
 */
export default function Chip({ label, active, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      hitSlop={{ top: 6, bottom: 6 }}
      style={({ pressed }) => ({
        height: 36,
        paddingHorizontal: 16,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? Colors.background.light : Colors.background.card,
        borderWidth: 1,
        borderColor: active ? Colors.border.light : Colors.border.default,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text
        className="text-[13px] font-semibold"
        style={{ color: active ? Colors.text.primary : Colors.text.tertiary }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
