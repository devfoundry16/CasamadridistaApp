import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import type { FeedTab } from "@/services/FeedService";
import Colors from "@/constants/colors";

interface Props {
  active: FeedTab;
  onSelect: (tab: FeedTab) => void;
  /** Shown after the tabs, outside their scroll (Community's people search). */
  trailing?: React.ReactNode;
}

export default function FeedTabs({ active, onSelect, trailing }: Props) {
  const { t } = useTranslation();

  const TABS: { key: FeedTab; label: string }[] = [
    { key: "for-you",    label: t('community.tabForYou') },
    { key: "trending",   label: t('community.tabTrending') },
    { key: "fan-clubs",  label: t('community.tabFanClubs') },
    { key: "recent",     label: t('community.tabRecent') },
  ];

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
