import React, { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Colors from "@/constants/colors";
import { useFootball } from "@/hooks/useFootball";
import type { Coach, CoachWithTeam, Player } from "@/types/soccer/profile";
import PlayerRow, { type SquadMetric } from "./PlayerRow";
import SectionHeading from "./SectionHeading";
import SurfaceCard from "./SurfaceCard";
import EmptyState from "./EmptyState";
import Chip from "./Chip";

interface Props {
  teamId: number;
  /** Hide the metric chips when embedded in a compact opponent profile. */
  showMetricChips?: boolean;
}

/**
 * Replaces ~180 lines duplicated between app/(tabs)/team.tsx and
 * app/team/[id].tsx — five copy-pasted position sections plus a local
 * PlayerCard, in both files.
 */
export default function SquadList({ teamId, showMetricChips = true }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { playersList, coachList } = useFootball();
  const [metric, setMetric] = useState<SquadMetric>("general");

  const squad = playersList.find((p) => p.team.id === teamId);
  const coachWithTeam = coachList.find((c) => c.team.id === teamId) as
    | CoachWithTeam
    | undefined;
  const coach = coachWithTeam?.player as Coach | undefined;

  // Memoised: the original ran four .filter() passes on every render.
  const groups = useMemo(() => {
    const all = squad?.player ?? [];
    return [
      { key: "goalkeepers", players: all.filter((p) => p.position === "Goalkeeper") },
      { key: "defenders", players: all.filter((p) => p.position === "Defender") },
      { key: "midfielders", players: all.filter((p) => p.position === "Midfielder") },
      { key: "forwards", players: all.filter((p) => p.position === "Attacker") },
    ];
  }, [squad]);

  const total = groups.reduce((n, g) => n + g.players.length, 0);

  if (total === 0 && !coach) {
    return <EmptyState title={t("team.emptySquad")} />;
  }

  // Only General/Age/Height: the Player type carries no market value or
  // contract data, so Sofascore's other two chips would be dead controls.
  const metrics: { key: SquadMetric; label: string }[] = [
    { key: "general", label: t("team.general") },
    { key: "age", label: t("team.age") },
    { key: "height", label: t("team.height") },
  ];

  return (
    <View>
      {showMetricChips ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 16 }}
        >
          {metrics.map((m) => (
            <Chip
              key={m.key}
              label={m.label}
              active={metric === m.key}
              onPress={() => setMetric(m.key)}
            />
          ))}
        </ScrollView>
      ) : null}

      <View style={{ paddingHorizontal: 16, gap: 20 }}>
        {coach ? (
          <View>
            <SectionHeading title={t("team.coach")} />
            <SurfaceCard padded={false}>
              <PlayerRow
                player={coach}
                variant="coach"
                onPress={() => router.push(`/coach/${coach.id}` as never)}
              />
            </SurfaceCard>
          </View>
        ) : null}

        {groups.map((group) =>
          group.players.length === 0 ? null : (
            <View key={group.key}>
              <SectionHeading title={t(`team.${group.key}`)} />
              <SurfaceCard padded={false}>
                {group.players.map((player: Player, i) => (
                  <View key={player.id}>
                    <PlayerRow
                      player={player}
                      metric={metric}
                      onPress={() =>
                        router.push(`/player/${teamId}/${player.id}` as never)
                      }
                    />
                    {i < group.players.length - 1 ? (
                      <View
                        style={{
                          height: 1,
                          backgroundColor: Colors.border.default,
                          marginHorizontal: 14,
                        }}
                      />
                    ) : null}
                  </View>
                ))}
              </SurfaceCard>
            </View>
          ),
        )}
      </View>
    </View>
  );
}
