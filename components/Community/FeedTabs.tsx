import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import type { FeedTab } from "@/services/FeedService";
import Colors from "@/constants/colors";

const TABS: { key: FeedTab; label: string }[] = [
  { key: "for-you", label: "For You" },
  { key: "trending", label: "Trending" },
  { key: "fan-clubs", label: "Fan Clubs" },
  { key: "recent", label: "Recent" },
];

interface Props {
  active: FeedTab;
  onSelect: (tab: FeedTab) => void;
}

export default function FeedTabs({ active, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{
        borderBottomWidth: 1,
        borderColor: Colors.border.default,
        backgroundColor: Colors.background.medium,
        flexGrow: 0,
      }}
      contentContainerStyle={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            className="px-4 py-1.5 mr-1 rounded-full"
            style={{
              backgroundColor: isActive ? Colors.darkGold : "transparent",
            }}
            activeOpacity={0.7}
          >
            <Text
              className="text-sm font-semibold"
              style={{
                color: isActive ? Colors.textWhite : Colors.text.tertiary,
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
