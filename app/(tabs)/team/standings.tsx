import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, RefreshControl, SectionList, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { Text } from "@/components/Text";
import Colors from "@/constants/colors";
import SurfaceCard from "@/components/Team/SurfaceCard";
import SegmentedToggle from "@/components/Team/SegmentedToggle";
import PickerPill from "@/components/Team/PickerPill";
import EmptyState from "@/components/Team/EmptyState";
import ErrorState from "@/components/Team/ErrorState";
import StandingsHeaderRow from "@/components/Team/Standings/StandingsHeaderRow";
import StandingsRow from "@/components/Team/Standings/StandingsRow";
import StandingsRowDetail from "@/components/Team/Standings/StandingsRowDetail";
import PinnedTeamRow from "@/components/Team/Standings/PinnedTeamRow";
import ZoneLegend from "@/components/Team/Standings/ZoneLegend";
import { usePinnedTeamRow } from "@/components/Team/Standings/usePinnedTeamRow";
import { STANDINGS_LAYOUT as L } from "@/components/Team/Standings/layout";
import {
  buildStandingsSections,
  type StandingsSection,
} from "@/components/Team/Standings/zones";
import {
  findCompetition,
  formatSeasonLong,
  initialSelection,
  selectCompetition,
  selectSeason,
  type Selection,
} from "@/components/Team/Standings/competitions";
import { useStandings, useTeamCompetitions } from "@/hooks/football/queries";
import { useSeason } from "@/hooks/football/useSeason";
import { LA_LIGA_LEAGUE_ID, REAL_MADRID_TEAM_ID } from "@/constants/football";
import type { StandingRow, StandingSplit } from "@/types/soccer/standings";

type Scope = "all" | "home" | "away";

/** The split the current scope reads, and the numbers derived from it. */
function splitFor(row: StandingRow, scope: Scope): StandingSplit {
  return scope === "home" ? row.home : scope === "away" ? row.away : row.all;
}

// StandingSplit carries no `points` field — only played/win/draw/lose/goals —
// so home and away points have to be derived.
const pointsOf = (s: StandingSplit) => s.win * 3 + s.draw;
const diffOf = (s: StandingSplit) => s.goals.for - s.goals.against;

/**
 * Home and Away are genuinely re-ordered tables with their own 1..N ranks, the
 * way SofaScore does it. Keeping the overall order and swapping only the numbers
 * would show rank 3 on 12 pts above rank 4 on 18 pts, which reads as a bug.
 *
 * LaLiga's real tiebreaker is head-to-head, which the API's overall `rank`
 * already encodes; a home-only table has no official tiebreaker at all, so
 * pts -> GD -> GF is the standard approximation. Final tiebreak on overall rank
 * keeps the sort deterministic.
 */
function rowsForScope(rows: StandingRow[], scope: Scope): StandingRow[] {
  if (scope === "all") return rows;
  return [...rows].sort((a, b) => {
    const sa = splitFor(a, scope);
    const sb = splitFor(b, scope);
    return (
      pointsOf(sb) - pointsOf(sa) ||
      diffOf(sb) - diffOf(sa) ||
      sb.goals.for - sa.goals.for ||
      a.rank - b.rank
    );
  });
}

export default function TeamStandingsTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const listRef = useRef<SectionList<StandingRow, StandingsSection>>(null);
  const fallbackSeason = useSeason();

  const [scope, setScope] = useState<Scope>("all");
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);

  const catalog = useTeamCompetitions();

  // Seed the selection once the catalog lands. Until then `selection` is null
  // and the standings query stays disabled, so no request is ever issued for a
  // pair that hasn't been validated.
  useEffect(() => {
    if (!catalog.data || selection) return;
    setSelection(
      initialSelection(catalog.data, catalog.data.currentSeason ?? fallbackSeason),
    );
  }, [catalog.data, selection, fallbackSeason]);

  // A catalog outage degrades to the behaviour this screen always had rather
  // than blanking the tab: La Liga, current season, pills disabled.
  const effective: Selection | null =
    selection ??
    (catalog.isError ? { leagueId: LA_LIGA_LEAGUE_ID, season: fallbackSeason } : null);

  const competition = findCompetition(catalog.data, effective?.leagueId ?? 0);

  const { data, isPending, isError, refetch, isRefetching } = useStandings(
    effective?.leagueId,
    effective?.season,
    { enabled: !!effective },
  );

  const rows = useMemo(() => data ?? [], [data]);
  const scoped = useMemo(() => rowsForScope(rows, scope), [rows, scope]);

  // Derived from the UNSCOPED rows on purpose: the home/away transform below
  // blanks `group`, so reading multiGroup off `built` would report false in
  // exactly the group-stage case this is testing for.
  const isMultiGroup = useMemo(() => new Set(rows.map((r) => r.group)).size > 1, [rows]);

  // Zones belong to the overall table. Painting a Champions League rail on the
  // top of a home-only table would be a factual claim that is false, so
  // Home/Away render as one flat, unlabelled band.
  const built = useMemo(
    () =>
      scope === "all"
        ? buildStandingsSections(scoped, competition?.name)
        : buildStandingsSections(
            scoped.map((row) => ({ ...row, description: null, group: "" })),
          ),
    [scoped, scope, competition?.name],
  );

  const displayRank = useCallback(
    (row: StandingRow, index: number) => (scope === "all" ? row.rank : index + 1),
    [scope],
  );

  const ownTeamLocation = built.teamLocation.get(REAL_MADRID_TEAM_ID);
  const { pin, onViewableItemsChanged, viewabilityConfig } = usePinnedTeamRow(
    REAL_MADRID_TEAM_ID,
    ownTeamLocation,
    built.sectionOffsets,
  );

  const scrollToOwnTeam = useCallback(() => {
    if (!ownTeamLocation) return;
    listRef.current?.scrollToLocation({
      sectionIndex: ownTeamLocation.sectionIndex,
      itemIndex: ownTeamLocation.itemIndex,
      viewPosition: 0.5,
      animated: true,
    });
  }, [ownTeamLocation]);

  const changeSelection = useCallback((next: Selection) => {
    // One setState, one commit, one frame — the pills can never disagree.
    setSelection(next);
    setExpandedTeamId(null);
  }, []);

  // A group stage has no meaningful home/away table: rowsForScope would sort
  // all 32 Club World Cup teams into one ranking across groups that never
  // played each other.
  useEffect(() => {
    if (isMultiGroup && scope !== "all") setScope("all");
  }, [isMultiGroup, scope]);

  const competitions = catalog.data?.competitions ?? [];
  const seasons = competition?.seasons ?? [];

  const pills = (
    <View
      style={{
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: L.outerPadding,
        paddingTop: 12,
      }}
    >
      <PickerPill<number>
        title={t("team.selectCompetition")}
        options={competitions.map((c) => ({
          value: c.id,
          label: c.name,
          iconUri: c.logo,
          caption: c.country ?? undefined,
        }))}
        value={effective?.leagueId ?? 0}
        onChange={(id) =>
          catalog.data &&
          effective &&
          changeSelection(selectCompetition(catalog.data, effective, id))
        }
        iconUri={competition?.logo}
        placeholder={catalog.isPending ? "—" : t("team.selectCompetition")}
        disabled={!catalog.data || !effective}
        maxWidth={210}
      />
      <PickerPill<number>
        title={t("team.selectSeason")}
        options={seasons.map((year) => ({ value: year, label: formatSeasonLong(year) }))}
        value={effective?.season ?? 0}
        onChange={(year) =>
          catalog.data &&
          effective &&
          changeSelection(selectSeason(catalog.data, effective, year))
        }
        placeholder="—"
        disabled={!catalog.data || !effective}
        numeric
      />
    </View>
  );

  const toggle = isMultiGroup ? null : (
    <View style={{ paddingHorizontal: L.outerPadding, paddingTop: 12, gap: 8 }}>
      <SegmentedToggle<Scope>
        options={[
          { key: "all", label: t("team.scopeAll") },
          { key: "home", label: t("team.scopeHome") },
          { key: "away", label: t("team.scopeAway") },
        ]}
        value={scope}
        onChange={(next) => {
          setScope(next);
          setExpandedTeamId(null);
        }}
      />
      {scope !== "all" ? (
        <Text className="text-[11px]" style={{ color: Colors.text.muted }}>
          {t("team.homeAwayNote")}
        </Text>
      ) : null}
    </View>
  );

  const header = (
    <View>
      {pills}
      {toggle}
    </View>
  );

  if (catalog.isPending) {
    return (
      <Screen>
        {header}
        <Loading />
      </Screen>
    );
  }

  // Nothing Madrid plays has a published table — reachable in the summer gap.
  // Two empty dropdowns would be worse than none, so the pills go away too.
  if (catalog.data && competitions.length === 0) {
    return (
      <Screen>
        <EmptyState
          title={t("team.emptyCompetitions")}
          body={t("team.emptyCompetitionsBody")}
          action={{ label: t("team.retry"), onPress: () => catalog.refetch() }}
        />
      </Screen>
    );
  }

  if (isPending) {
    return (
      <Screen>
        {header}
        <Loading />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        {header}
        <ErrorState title={t("team.errorStandings")} onRetry={refetch} />
      </Screen>
    );
  }

  if (rows.length === 0) {
    return (
      <Screen>
        {header}
        <EmptyState
          title={
            competition
              ? t("team.emptyStandingsFor", { competition: competition.name })
              : t("team.emptyStandings")
          }
        />
      </Screen>
    );
  }

  const ownRow = ownTeamLocation ? scoped[ownTeamLocation.flatIndex] : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>
      <SectionList
        // Remount on a competition/season change so the scroll offset resets —
        // 36 Champions League rows down to 20 La Liga rows would otherwise
        // leave the user scrolled past the end.
        key={`${effective?.leagueId}-${effective?.season}`}
        ref={listRef}
        style={{ flex: 1 }}
        // Room for the bottom-pinned row, so the last team is never stuck
        // permanently underneath it.
        contentContainerStyle={{ paddingBottom: 32 + L.pinnedHeight + 8 }}
        sections={built.sections}
        // Must tolerate a section object, not just a row. Once
        // onViewableItemsChanged is supplied, VirtualizedSectionList's
        // _convertViewable runs for every viewable token — section headers
        // included — and calls this with `viewable.item`, which for a header is
        // the section itself. Reading item.team.id unguarded crashes there, and
        // only once viewability is turned on, which makes it look unrelated.
        keyExtractor={(item, index) =>
          item?.team?.id != null ? String(item.team.id) : `section-${index}`
        }
        extraData={`${scope}:${expandedTeamId}`}
        ListHeaderComponent={
          <View>
            {header}
            <StandingsHeaderRow />
          </View>
        }
        // Sticky headers are deliberately OFF. matches.tsx keeps them because
        // month headers are navigational — you scroll to find March. Zone
        // labels are contextual, there are about four of them, and a sticky
        // header would fight the pinned Real Madrid row for the top edge. The
        // pinned row is the only sticky element on this screen.
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        // No getItemLayout (expanded rows are taller), so a long jump can miss.
        onScrollToIndexFailed={() => {}}
        refreshControl={
          // Standings only. The catalog is 24h-stale data about which
          // competitions exist; refetching it here would make competitions
          // appear and disappear under the user's finger.
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.darkGold}
          />
        }
        renderSectionHeader={({ section }) => (
          <ZoneHeader section={section} showGroup={built.multiGroup} />
        )}
        renderItem={({ item, index, section }) => {
          const split = splitFor(item, scope);
          const flatIndex = (built.sectionOffsets[section.key] ?? 0) + index;
          const rank = displayRank(item, flatIndex);
          const expanded = expandedTeamId === item.team.id;

          return (
            <Band section={section} index={index} expanded={expanded}>
              <StandingsRow
                row={item}
                rank={rank}
                played={split.played}
                goalsDiff={scope === "all" ? item.goalsDiff : diffOf(split)}
                points={scope === "all" ? item.points : pointsOf(split)}
                zoneColor={section.color}
                isOwnTeam={item.team.id === REAL_MADRID_TEAM_ID}
                onPress={() => setExpandedTeamId(expanded ? null : item.team.id)}
                accessibilityLabel={t("team.a11yStandingRow", {
                  team: item.team.name,
                  rank,
                  points: scope === "all" ? item.points : pointsOf(split),
                })}
              />
              {expanded ? (
                <StandingsRowDetail
                  split={split}
                  // `form` is the overall run of results; showing it under a
                  // home-only table would misattribute it.
                  form={scope === "all" ? item.form : null}
                  onViewTeam={
                    item.team.id === REAL_MADRID_TEAM_ID
                      ? undefined
                      : () => router.push(`/team/${item.team.id}`)
                  }
                />
              ) : null}
            </Band>
          );
        }}
        ListFooterComponent={
          <Footer
            sections={scope === "all" ? built.sections : []}
            updated={rows[0]?.update}
          />
        }
      />

      {ownRow && ownTeamLocation ? (
        <PinnedTeamRow
          row={ownRow}
          rank={displayRank(ownRow, ownTeamLocation.flatIndex)}
          played={splitFor(ownRow, scope).played}
          goalsDiff={scope === "all" ? ownRow.goalsDiff : diffOf(splitFor(ownRow, scope))}
          points={scope === "all" ? ownRow.points : pointsOf(splitFor(ownRow, scope))}
          pin={pin}
          onPress={scrollToOwnTeam}
          accessibilityLabel={t("team.a11yJumpToTeam")}
        />
      ) : null}
    </View>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>{children}</View>
  );
}

function Loading() {
  return (
    <View className="py-10 items-center">
      <ActivityIndicator color={Colors.darkGold} />
    </View>
  );
}

/**
 * One row's slice of the continuous band card. Same recipe as matches.tsx:110 —
 * a SurfaceCard per row with the corner radii zeroed except at the ends, so a
 * run of rows reads as one card. The card's own bottom border draws the
 * hairline between rows, so there are no separator views.
 */
function Band({
  section,
  index,
  expanded,
  children,
}: {
  section: StandingsSection;
  index: number;
  expanded: boolean;
  children: React.ReactNode;
}) {
  const first = index === 0;
  const last = index === section.data.length - 1;
  return (
    <View style={{ paddingHorizontal: L.outerPadding }}>
      <SurfaceCard
        padded={false}
        style={{
          borderTopLeftRadius: first ? 12 : 0,
          borderTopRightRadius: first ? 12 : 0,
          borderBottomLeftRadius: last ? 12 : 0,
          borderBottomRightRadius: last ? 12 : 0,
          borderTopWidth: first ? 1 : 0,
          ...(expanded ? { backgroundColor: Colors.background.medium } : null),
        }}
      >
        {children}
      </SurfaceCard>
    </View>
  );
}

function ZoneHeader({
  section,
  showGroup,
}: {
  section: StandingsSection;
  showGroup: boolean;
}) {
  const { t } = useTranslation();

  // A stage inside this same competition names its round ("Play Offs:
  // 1/8-finals"); anything else uses the zone label; an unrecognised
  // description shows verbatim, because an untranslated but truthful label
  // beats a confidently wrong translated one.
  const zoneLabel =
    section.stageLabel ??
    (section.labelKey ? t(section.labelKey) : section.rawDescription);

  // The group name belongs on the first band of its group only. Repeating it
  // produced "Group A · Play Offs" followed by a bare "Group A", eight times
  // over on the Club World Cup.
  const groupLabel = showGroup && section.isGroupStart ? section.group : null;

  if (!zoneLabel && !groupLabel) return <View style={{ height: 10 }} />;

  return (
    <View
      style={{
        paddingHorizontal: L.outerPadding,
        paddingTop: groupLabel ? 18 : 14,
        paddingBottom: 6,
      }}
    >
      {groupLabel ? (
        <Text
          className="text-[13px] font-bold"
          style={{ color: Colors.text.primary, marginBottom: zoneLabel ? 6 : 0 }}
        >
          {groupLabel}
        </Text>
      ) : null}

      {zoneLabel ? (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* No rail for an unzoned band — a transparent one still occupied its
              width and left a phantom indent. */}
          {section.zone !== "none" ? (
            <View
              style={{
                width: L.railWidth,
                height: 12,
                borderRadius: 2,
                marginEnd: 8,
                backgroundColor: section.color,
              }}
            />
          ) : null}
          <Text className="text-[11px] font-bold" style={{ color: Colors.text.tertiary }}>
            {zoneLabel}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function Footer({
  sections,
  updated,
}: {
  sections: StandingsSection[];
  updated: string | undefined;
}) {
  const { t } = useTranslation();

  return (
    <View>
      <ZoneLegend sections={sections} />
      {updated ? (
        <View style={{ paddingHorizontal: L.outerPadding, paddingTop: 16 }}>
          <Text className="text-[11px]" style={{ color: Colors.text.muted }}>
            {t("team.standingsUpdated", { date: new Date(updated).toLocaleDateString() })}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
