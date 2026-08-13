import React, { useMemo, useState } from "react";
import { ActivityIndicator, SectionList, ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";
import Colors from "@/constants/colors";
import { useSeasonFixtures } from "@/hooks/football/queries";
import { REAL_MADRID_TEAM_ID } from "@/constants/football";
import SegmentedToggle from "@/components/Team/SegmentedToggle";
import SurfaceCard from "@/components/Team/SurfaceCard";
import MatchRow from "@/components/Team/MatchRow";
import MatchCalendar from "@/components/Team/MatchCalendar";
import EmptyState from "@/components/Team/EmptyState";
import ErrorState from "@/components/Team/ErrorState";
import { Text } from "@/components/Text";
import { byDateAsc, kickoff, monthKey } from "@/components/Team/matchUtils";
import type { Match } from "@/types/soccer/match";

const TEAM_ID = REAL_MADRID_TEAM_ID;
type Mode = "list" | "calendar";

export default function TeamMatchesTab() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("list");
  const [month, setMonth] = useState(() => new Date());

  const { data, isPending, isError, refetch } = useSeasonFixtures(TEAM_ID);

  const sorted = useMemo(() => [...(data ?? [])].sort(byDateAsc), [data]);

  const sections = useMemo(() => {
    const buckets = new Map<string, Match[]>();
    for (const m of sorted) {
      const key = monthKey(kickoff(m));
      const list = buckets.get(key);
      if (list) list.push(m);
      else buckets.set(key, [m]);
    }
    return Array.from(buckets.entries()).map(([key, matches]) => ({
      key,
      title: kickoff(matches[0]).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
      data: matches,
    }));
  }, [sorted]);

  const toggle = (
    <View style={{ padding: 16, paddingBottom: 8 }}>
      <SegmentedToggle<Mode>
        options={[
          { key: "list", label: t("team.list") },
          { key: "calendar", label: t("team.calendar") },
        ]}
        value={mode}
        onChange={setMode}
      />
    </View>
  );

  if (isPending) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>
        {toggle}
        <View className="py-10 items-center">
          <ActivityIndicator color={Colors.darkGold} />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>
        {toggle}
        <ErrorState title={t("team.errorMatches")} onRetry={refetch} />
      </View>
    );
  }

  if (sorted.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>
        {toggle}
        <EmptyState title={t("team.emptyMatches")} />
      </View>
    );
  }

  if (mode === "calendar") {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.background.deepDark }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {toggle}
        <View style={{ paddingHorizontal: 16 }}>
          <MatchCalendar
            matches={sorted}
            teamId={TEAM_ID}
            month={month}
            onMonthChange={setMonth}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <SectionList
      style={{ flex: 1, backgroundColor: Colors.background.deepDark }}
      contentContainerStyle={{ paddingBottom: 32 }}
      sections={sections}
      keyExtractor={(item) => String(item.fixture.id)}
      ListHeaderComponent={toggle}
      stickySectionHeadersEnabled
      showsVerticalScrollIndicator={false}
      renderSectionHeader={({ section }) => (
        <View
          style={{
            backgroundColor: Colors.background.deepDark,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 6,
          }}
        >
          <Text
            className="text-[11px] font-bold"
            style={{ color: Colors.text.tertiary }}
          >
            {section.title}
          </Text>
        </View>
      )}
      renderItem={({ item, index, section }) => (
        <View style={{ paddingHorizontal: 16 }}>
          <SurfaceCard
            padded={false}
            style={{
              borderTopLeftRadius: index === 0 ? 16 : 0,
              borderTopRightRadius: index === 0 ? 16 : 0,
              borderBottomLeftRadius: index === section.data.length - 1 ? 16 : 0,
              borderBottomRightRadius: index === section.data.length - 1 ? 16 : 0,
              borderTopWidth: index === 0 ? 1 : 0,
            }}
          >
            <MatchRow match={item} teamId={TEAM_ID} />
          </SurfaceCard>
        </View>
      )}
    />
  );
}
