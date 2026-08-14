import React, { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/Text";
import Touchable from "@/components/Touchable";
import Colors from "@/constants/colors";
import { useTopAssists, useTopScorers } from "@/hooks/football/queries";
import { REAL_MADRID_TEAM_ID } from "@/constants/football";
import SectionHeading from "@/components/Team/SectionHeading";
import SurfaceCard from "@/components/Team/SurfaceCard";
import SegmentedToggle from "@/components/Team/SegmentedToggle";
import EmptyState from "@/components/Team/EmptyState";
import ErrorState from "@/components/Team/ErrorState";
import Chip from "@/components/Team/Chip";
import type { TopPlayerEntry } from "@/types/soccer/topPlayers";

type Metric = "goals" | "assists";

function valueFor(entry: TopPlayerEntry, metric: Metric): number {
  const line = entry.statistics?.[0];
  if (!line) return 0;
  return (metric === "goals" ? line.goals?.total : line.goals?.assists) ?? 0;
}

function LeaderRow({
  entry,
  rank,
  metric,
  onPress,
}: {
  entry: TopPlayerEntry;
  rank: number;
  metric: Metric;
  onPress: () => void;
}) {
  const line = entry.statistics?.[0];
  const isRealMadrid = line?.team?.id === REAL_MADRID_TEAM_ID;

  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        height: 56,
        paddingHorizontal: 14,
        backgroundColor: pressed ? Colors.background.light : "transparent",
        // Real Madrid rows are marked rather than filtered — topscorers is
        // league-wide, so filtering would empty the tab whenever no RM player
        // is in the top 20.
        borderStartWidth: isRealMadrid ? 3 : 0,
        borderStartColor: Colors.darkGold,
      })}
    >
      <Text
        className="text-[12px] font-semibold"
        style={{ color: Colors.text.muted, width: 22 }}
      >
        {rank}
      </Text>
      <Image
        source={{ uri: entry.player.photo }}
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          marginEnd: 10,
          backgroundColor: Colors.background.light,
        }}
        contentFit="cover"
      />
      <View className="flex-1">
        <Text
          className="text-[14px] font-semibold"
          style={{ color: Colors.text.primary }}
          numberOfLines={1}
        >
          {entry.player.name}
        </Text>
        <Text className="text-[11px]" style={{ color: Colors.text.tertiary }} numberOfLines={1}>
          {line?.team?.name}
        </Text>
      </View>
      <Text
        className="text-[17px] font-bold"
        style={{ color: Colors.darkGold, fontVariant: ["tabular-nums"] }}
      >
        {valueFor(entry, metric)}
      </Text>
    </Touchable>
  );
}

export default function TeamTopPlayersTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const [metric, setMetric] = useState<Metric>("goals");
  const [realMadridOnly, setRealMadridOnly] = useState(false);

  const scorers = useTopScorers();
  const assists = useTopAssists();
  const active = metric === "goals" ? scorers : assists;

  const rows = useMemo(() => {
    const all = active.data ?? [];
    const filtered = realMadridOnly
      ? all.filter((e) => e.statistics?.[0]?.team?.id === REAL_MADRID_TEAM_ID)
      : all;
    return filtered.slice(0, 20);
  }, [active.data, realMadridOnly]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background.deepDark }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <SegmentedToggle<Metric>
        options={[
          { key: "goals", label: t("team.goals") },
          { key: "assists", label: t("team.assists") },
        ]}
        value={metric}
        onChange={setMetric}
      />

      <View style={{ flexDirection: "row" }}>
        <Chip
          label={t("team.realMadridOnly")}
          active={realMadridOnly}
          onPress={() => setRealMadridOnly((v) => !v)}
        />
      </View>

      <View>
        <SectionHeading
          title={metric === "goals" ? t("team.goals") : t("team.assists")}
        />
        <SurfaceCard padded={false}>
          {active.isPending ? (
            <View className="py-10 items-center">
              <ActivityIndicator color={Colors.darkGold} />
            </View>
          ) : active.isError ? (
            <ErrorState
              title={t("team.errorGeneric")}
              onRetry={active.refetch}
              compact
            />
          ) : rows.length === 0 ? (
            <EmptyState title={t("team.emptyTopPlayers")} />
          ) : (
            rows.map((entry, i) => (
              <View key={entry.player.id}>
                <LeaderRow
                  entry={entry}
                  rank={i + 1}
                  metric={metric}
                  onPress={() =>
                    router.push(
                      `/player/${entry.statistics?.[0]?.team?.id ?? REAL_MADRID_TEAM_ID}/${entry.player.id}` as never,
                    )
                  }
                />
                {i < rows.length - 1 ? (
                  <View
                    style={{
                      height: 1,
                      backgroundColor: Colors.border.default,
                      marginHorizontal: 14,
                    }}
                  />
                ) : null}
              </View>
            ))
          )}
        </SurfaceCard>
      </View>
    </ScrollView>
  );
}
