import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import type { FeedTab } from "@/services/FeedService";
import Colors from "@/constants/colors";

interface Props {
  active: FeedTab;
  onSelect: (tab: FeedTab) => void;
  /** Shown after the tabs, outside their scroll (the people search). */
  trailing?: React.ReactNode;
  /** Which tabs, in order. Home leaves out fan-clubs: that feed has its own tab. */
  tabs?: readonly FeedTab[];
}

const ALL_TABS: readonly FeedTab[] = ["for-you", "trending", "fan-clubs", "recent"];

export default function FeedTabs({ active, onSelect, trailing, tabs = ALL_TABS }: Props) {
  const { t } = useTranslation();

  const LABELS: Record<FeedTab, string> = {
    "for-you": t('community.tabForYou'),
    trending: t('community.tabTrending'),
    "fan-clubs": t('community.tabFanClubs'),
    recent: t('community.tabRecent'),
    reels: t('community.tabReels'),
  };
  const TABS = tabs.map((key) => ({ key, label: LABELS[key] }));

  return (
    <View style={styles.bar}>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            activeOpacity={0.7}
            style={styles.tab}
          >
            <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
              {tab.label}
            </Text>
            {isActive && <View style={styles.underline} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
    {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 4,
    position: "relative",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  labelActive: {
    color: Colors.text.primary,
  },
  labelInactive: {
    color: Colors.text.tertiary,
  },
  underline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.darkGold,
    borderRadius: 1,
  },
});
