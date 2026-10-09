import React from "react";
import { ScrollView } from "react-native";
import Chip from "@/components/Team/Chip";

interface Props<K extends string> {
  options: { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
  accessibilityLabel?: string;
}

/**
 * A row of chips that scrolls sideways. Chips rather than SegmentedToggle once
 * there are more than about three options: equal-width segments cut labels.
 */
export default function ChipRow<K extends string>({ options, value, onChange, accessibilityLabel }: Props<K>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
      style={{ marginHorizontal: -16, flexGrow: 0 }}
    >
      {options.map((o) => (
        <Chip key={o.key} label={o.label} active={o.key === value} onPress={() => onChange(o.key)} />
      ))}
    </ScrollView>
  );
}
