import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/Text";
import Colors from "@/constants/colors";
import EmptyState from "@/components/Team/EmptyState";
import ErrorState from "@/components/Team/ErrorState";
import SurfaceCard from "@/components/Team/SurfaceCard";
import PlayerFilters from "@/components/Team/Leaders/PlayerFilters";
import SearchField from "@/components/Team/Leaders/SearchField";
import { RowDivider } from "@/components/Team/Leaders/LeaderRow";
import { PlayerEntryRow, TeamEntryRow } from "@/components/Team/Leaders/EntryRows";
import { useLeaderboard, useTeamLeaders } from "@/hooks/football/queries";
import { useDebounced } from "@/hooks/social/useFriends";
import { REAL_MADRID_TEAM_ID } from "@/constants/football";
import {
  POSITIONS,
  leaderParams,
  minMinutesOf,
  type LeaderMode,
  type LeaderScope,
  type Position,
} from "@/utils/topPlayers.core";
import type { LeaderEntry, TeamLeaderEntry } from "@/types/soccer/leaders";

/** The most rows the backend sends for one stat. */
const FULL_LIST = 200;

const intParam = (raw: string | undefined) => (raw && /^\d+$/.test(raw) ? Number(raw) : 0);
const asPosition = (raw: string | undefined): Position | null =>
  (POSITIONS as readonly string[]).includes(raw ?? "") ? (raw as Position) : null;

/**
 * "See all" for one Top Players stat: the whole ranking, with the same filters
 * as the tab and a search. A search narrows the list; the ranks stay the real
 * ones, so a player found at 14th still reads 14th.
 */
export default function LeaderboardScreen() {
  const params = useLocalSearchParams<{
    stat: string;
    kind?: string;
    league?: string;
    season?: string;
    scope?: string;
    position?: string;
    mode?: string;
  }>();
  const { t } = useTranslation();
  const isTeam = params.kind === "team";
  const leagueId = intParam(params.league);
  const season = intParam(params.season);
  const stat = String(params.stat ?? "");

  const [scope, setScope] = useState<LeaderScope>(params.scope === "team" ? "team" : "all");
  const [position, setPosition] = useState<Position | null>(asPosition(params.position));
  const [mode, setMode] = useState<LeaderMode>(params.mode === "per90" ? "per90" : "total");
  const [search, setSearch] = useState("");
  const q = useDebounced(search, 300);

  const query = useMemo(
    () => leaderParams({ scope, position, mode, q, limit: FULL_LIST }),
    [scope, position, mode, q],
  );
  const board = useLeaderboard(leagueId, season, stat, query, { enabled: !isTeam });
  const teams = useTeamLeaders(leagueId, season, { enabled: isTeam });

  const title = isTeam ? t(`team.leaders.teamStat.${stat}`) : t(`team.leaders.stat.${stat}`);
  const ourTeamId = (isTeam ? teams.data?.teamId : board.data?.teamId) ?? REAL_MADRID_TEAM_ID;

  const teamStat = teams.data?.stats.find((s) => s.key === stat);
  const teamRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const all = teamStat?.entries ?? [];
    return needle ? all.filter((e) => (e.name ?? "").toLowerCase().includes(needle)) : all;
  }, [teamStat, search]);

  const meta = board.data?.stat;
  const status = isTeam ? teams.data?.status : board.data?.status;
  const pending = isTeam ? teams.isPending : board.isPending;
  const failed = isTeam ? teams.isError : board.isError;
  const refetch = isTeam ? teams.refetch : board.refetch;
  const rows: (LeaderEntry | TeamLeaderEntry)[] = isTeam ? teamRows : board.data?.entries ?? [];
  const minMinutes = !isTeam && meta ? minMinutesOf(meta) : null;

  const header = (
    <View style={{ gap: 12, paddingBottom: 12 }}>
      {!isTeam ? (
        <PlayerFilters
          scope={scope}
          onScope={setScope}
          position={position}
          onPosition={setPosition}
          mode={mode}
          onMode={setMode}
          showMode={(meta?.modes.length ?? 0) > 1}
        />
      ) : null}
      <SearchField
        value={search}
        onChange={setSearch}
        placeholder={isTeam ? t("team.leaders.searchTeams") : t("team.leaders.searchPlayers")}
      />
      {minMinutes ? (
        <Text className="text-[11px]" style={{ color: Colors.text.muted }}>
          {t("team.leaders.minMinutes", { minutes: minMinutes })}
        </Text>
      ) : null}
    </View>
  );

  const empty = pending ? (
    <View className="py-10 items-center">
      <ActivityIndicator color={Colors.darkGold} />
    </View>
  ) : failed ? (
    <ErrorState title={t("team.errorGeneric")} onRetry={refetch} compact />
  ) : status === "syncing" ? (
    <EmptyState title={t("team.leaders.syncingTitle")} body={t("team.leaders.syncingBody")} />
  ) : status === "unavailable" || (meta && !meta.available) ? (
    <EmptyState title={t("team.leaders.unavailableTitle")} body={t("team.leaders.unavailableBody")} />
  ) : (
    <EmptyState title={search.trim() ? t("team.leaders.noResults") : t("team.emptyTopPlayers")} />
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>
      <Stack.Screen options={{ title }} />
      <FlatList
        data={rows}
        keyExtractor={(e) =>
          "player_id" in e ? `${e.player_id}:${e.fixture_id ?? e.team_id}` : String(e.team_id)
        }
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index }) => (
          // One card drawn across rows: only the first rounds its top, only
          // the last its bottom, so a 200-row list stays a virtualised FlatList.
          <SurfaceCard
            padded={false}
            style={[
              index > 0 && { borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTopWidth: 0 },
              index < rows.length - 1 && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomWidth: 0 },
            ]}
          >
            {"player_id" in item ? (
              <PlayerEntryRow entry={item} unit={meta?.unit ?? "count"} ourTeamId={ourTeamId} />
            ) : (
              <TeamEntryRow entry={item} unit={teamStat?.unit ?? "count"} ourTeamId={ourTeamId} />
            )}
            {index < rows.length - 1 ? <RowDivider /> : null}
          </SurfaceCard>
        )}
      />
    </View>
  );
}
