import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/Text";
import Colors from "@/constants/colors";
import SegmentedToggle from "@/components/Team/SegmentedToggle";
import PickerPill from "@/components/Team/PickerPill";
import EmptyState from "@/components/Team/EmptyState";
import ErrorState from "@/components/Team/ErrorState";
import ChipRow from "@/components/Team/Leaders/ChipRow";
import PlayerFilters from "@/components/Team/Leaders/PlayerFilters";
import SearchField from "@/components/Team/Leaders/SearchField";
import StatCard from "@/components/Team/Leaders/StatCard";
import { PlayerEntryRow, TeamEntryRow } from "@/components/Team/Leaders/EntryRows";
import {
  findCompetition,
  formatSeasonLong,
  initialSelection,
  selectCompetition,
  selectSeason,
  type Selection,
} from "@/components/Team/Standings/competitions";
import { useLeaders, useTeamCompetitions, useTeamLeaders } from "@/hooks/football/queries";
import { useSeason } from "@/hooks/football/useSeason";
import { LA_LIGA_LEAGUE_ID, REAL_MADRID_TEAM_ID } from "@/constants/football";
import {
  STAT_GROUPS,
  cardParams,
  leaderParams,
  minMinutesOf,
  visibleStats,
  type LeaderMode,
  type LeaderScope,
  type Position,
  type StatGroup,
} from "@/utils/topPlayers.core";

type Board = "players" | "teams";
type GroupKey = "all" | StatGroup;

/** Cards on the Teams view show this many clubs; "See all" shows the rest. */
const TEAM_PREVIEW = 5;

function Loading() {
  return (
    <View className="py-10 items-center">
      <ActivityIndicator color={Colors.darkGold} />
    </View>
  );
}

/**
 * Team > Top Players. Leaderboards for every stat our data provider
 * (API-Football) publishes, ranked by the backend from synced rows. A stat the
 * provider does not cover is never shown, not even as zeros.
 */
export default function TeamTopPlayersTab() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const fallbackSeason = useSeason();

  const [view, setView] = useState<Board>("players");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [scope, setScope] = useState<LeaderScope>("all");
  const [position, setPosition] = useState<Position | null>(null);
  const [mode, setMode] = useState<LeaderMode>("total");
  const [group, setGroup] = useState<GroupKey>("all");
  const [search, setSearch] = useState("");

  // The same competition catalog and selection rules as the Standings tab.
  const catalog = useTeamCompetitions();
  useEffect(() => {
    if (!catalog.data || selection) return;
    setSelection(initialSelection(catalog.data, catalog.data.currentSeason ?? fallbackSeason));
  }, [catalog.data, selection, fallbackSeason]);
  const effective: Selection | null =
    selection ?? (catalog.isError ? { leagueId: LA_LIGA_LEAGUE_ID, season: fallbackSeason } : null);
  const competition = findCompetition(catalog.data, effective?.leagueId ?? 0);

  const params = useMemo(() => leaderParams({ scope, position, mode }), [scope, position, mode]);
  const hub = useLeaders(effective?.leagueId ?? 0, effective?.season ?? 0, params, {
    enabled: view === "players" && !!effective,
  });
  const teams = useTeamLeaders(effective?.leagueId ?? 0, effective?.season ?? 0, {
    enabled: view === "teams" && !!effective,
  });

  const ourTeamId = hub.data?.teamId ?? teams.data?.teamId ?? REAL_MADRID_TEAM_ID;
  const statLabel = (key: string) => t(`team.leaders.stat.${key}`);
  const cards = useMemo(
    () => visibleStats(hub.data?.stats ?? [], { group, search, labelOf: (key) => t(`team.leaders.stat.${key}`) }),
    [hub.data, group, search, t],
  );

  const updatedAt = view === "players" ? hub.data?.updatedAt : teams.data?.updatedAt;
  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleString(i18n.language, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const seeAll = (stat: string, kind: "player" | "team", cardMode: LeaderMode = mode) => {
    if (!effective) return;
    router.push({
      pathname: "/team/leaders/[stat]",
      params: {
        stat,
        kind,
        league: String(effective.leagueId),
        season: String(effective.season),
        ...(kind === "player" ? cardParams({ scope, position, mode }, cardMode) : {}),
      },
    });
  };

  const pills = (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <PickerPill<number>
        title={t("team.selectCompetition")}
        options={(catalog.data?.competitions ?? []).map((c) => ({
          value: c.id,
          label: c.name,
          iconUri: c.logo,
          caption: c.country ?? undefined,
        }))}
        value={effective?.leagueId ?? 0}
        onChange={(id) => catalog.data && effective && setSelection(selectCompetition(catalog.data, effective, id))}
        iconUri={competition?.logo}
        placeholder={catalog.isPending ? "—" : t("team.selectCompetition")}
        disabled={!catalog.data || !effective}
        maxWidth={210}
      />
      <PickerPill<number>
        title={t("team.selectSeason")}
        options={(competition?.seasons ?? []).map((year) => ({ value: year, label: formatSeasonLong(year) }))}
        value={effective?.season ?? 0}
        onChange={(year) => catalog.data && effective && setSelection(selectSeason(catalog.data, effective, year))}
        placeholder="—"
        disabled={!catalog.data || !effective}
        numeric
      />
    </View>
  );

  const status = view === "players" ? hub.data?.status : teams.data?.status;
  const statusState =
    status === "syncing" ? (
      <EmptyState title={t("team.leaders.syncingTitle")} body={t("team.leaders.syncingBody")} />
    ) : status === "unavailable" ? (
      <EmptyState title={t("team.leaders.unavailableTitle")} body={t("team.leaders.unavailableBody")} />
    ) : null;

  const playersBody = () => {
    if (hub.isPending) return <Loading />;
    if (hub.isError) return <ErrorState title={t("team.errorGeneric")} onRetry={hub.refetch} compact />;
    if (statusState) return statusState;
    if (cards.length === 0) {
      return <EmptyState title={search.trim() ? t("team.leaders.noResults") : t("team.emptyTopPlayers")} />;
    }
    return cards.map((stat) => (
      <StatCard
        key={stat.key}
        title={statLabel(stat.key)}
        minMinutes={minMinutesOf(stat)}
        onSeeAll={() => seeAll(stat.key, "player", stat.mode)}
      >
        {stat.entries.map((entry) => (
          <PlayerEntryRow key={`${entry.player_id}:${entry.fixture_id ?? entry.team_id}`} entry={entry} unit={stat.unit} ourTeamId={ourTeamId} />
        ))}
      </StatCard>
    ));
  };

  const teamsBody = () => {
    if (teams.isPending) return <Loading />;
    if (teams.isError) return <ErrorState title={t("team.errorGeneric")} onRetry={teams.refetch} compact />;
    if (statusState) return statusState;
    const shown = (teams.data?.stats ?? []).filter((s) => s.entries.length > 0);
    if (shown.length === 0) return <EmptyState title={t("team.emptyTopPlayers")} />;
    return shown.map((stat) => (
      <StatCard key={stat.key} title={t(`team.leaders.teamStat.${stat.key}`)} onSeeAll={() => seeAll(stat.key, "team")}>
        {stat.entries.slice(0, TEAM_PREVIEW).map((entry) => (
          <TeamEntryRow key={entry.team_id} entry={entry} unit={stat.unit} ourTeamId={ourTeamId} />
        ))}
      </StatCard>
    ));
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background.deepDark }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <SegmentedToggle<Board>
        options={[
          { key: "players", label: t("team.leaders.players") },
          { key: "teams", label: t("team.leaders.teams") },
        ]}
        value={view}
        onChange={setView}
      />

      {pills}

      {view === "players" ? (
        <>
          <PlayerFilters
            scope={scope}
            onScope={setScope}
            position={position}
            onPosition={setPosition}
            mode={mode}
            onMode={setMode}
          />
          <SearchField value={search} onChange={setSearch} placeholder={t("team.leaders.searchStats")} />
          <ChipRow<GroupKey>
            options={(["all", ...STAT_GROUPS] as GroupKey[]).map((key) => ({ key, label: t(`team.leaders.group.${key}`) }))}
            value={group}
            onChange={setGroup}
          />
          {playersBody()}
        </>
      ) : (
        teamsBody()
      )}

      {updatedLabel && status === "ready" ? (
        <Text className="text-[11px]" style={{ color: Colors.text.muted, textAlign: "center" }}>
          {t("team.leaders.source", { time: updatedLabel })}
        </Text>
      ) : null}
    </ScrollView>
  );
}
