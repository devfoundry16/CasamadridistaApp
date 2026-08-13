import React from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/Text";
import Colors from "@/constants/colors";

interface Props<T extends string> {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}

/**
 * Active state is neutral #3A3A3A, deliberately NOT gold — gold is spent once
 * on the Details hero, and a second gold fill in the same viewport would turn
 * the signature into decoration.
 */
export default function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: Colors.background.card,
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: Colors.border.default,
      }}
    >
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            hitSlop={{ top: 4, bottom: 4 }}
            style={{
              flex: 1,
              height: 40,
              borderRadius: 9,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: active ? Colors.background.light : "transparent",
            }}
          >
            <Text
              className="text-[13px] font-semibold"
              style={{ color: active ? Colors.text.primary : Colors.text.tertiary }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
