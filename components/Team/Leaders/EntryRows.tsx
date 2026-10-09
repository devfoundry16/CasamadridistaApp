import React from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import LeaderRow from "./LeaderRow";
import { canOpenPlayer, formatLeaderValue, unitSuffixKey, type LeaderUnit } from "@/utils/topPlayers.core";
import type { LeaderEntry, TeamLeaderEntry } from "@/types/soccer/leaders";

/** A player on a leaderboard. Only our own players open the player screen. */
export function PlayerEntryRow({ entry, unit, ourTeamId }: { entry: LeaderEntry; unit: LeaderUnit; ourTeamId: number }) {
  const { t } = useTranslation();
  const router = useRouter();
  const unitKey = unitSuffixKey(unit);
  // A single-match board names the opponent; a season board names the club.
  const subtitle = entry.opponent_name ? t("team.leaders.versus", { team: entry.opponent_name }) : entry.team_name;

  return (
    <LeaderRow
      rank={entry.rank}
      imageUri={entry.photo}
      name={entry.name ?? "—"}
      subtitle={subtitle}
      badge={entry.position ? t(`team.leaders.position.${entry.position}`) : null}
      value={formatLeaderValue(entry.value, unit)}
      unit={unitKey ? t(unitKey) : null}
      highlight={entry.team_id === ourTeamId}
      onPress={
        canOpenPlayer(entry.team_id, ourTeamId)
          ? () => router.push(`/player/${ourTeamId}/${entry.player_id}` as never)
          : undefined
      }
    />
  );
}

/** A club on the Teams view. */
export function TeamEntryRow({ entry, unit, ourTeamId }: { entry: TeamLeaderEntry; unit: LeaderUnit; ourTeamId: number }) {
  const { t } = useTranslation();
  const unitKey = unitSuffixKey(unit);
  return (
    <LeaderRow
      rank={entry.rank}
      imageUri={entry.logo}
      name={entry.name ?? "—"}
      value={formatLeaderValue(entry.value, unit)}
      unit={unitKey ? t(unitKey) : null}
      highlight={entry.team_id === ourTeamId}
    />
  );
}
