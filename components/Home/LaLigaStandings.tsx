import React, { useMemo } from "react";
import { ActivityIndicator, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";

import { Text } from "@/components/Text";
import ErrorState from "@/components/Team/ErrorState";
import SectionHeading from "@/components/Team/SectionHeading";
import SurfaceCard from "@/components/Team/SurfaceCard";
import StandingsHeaderRow from "@/components/Team/Standings/StandingsHeaderRow";
import StandingsRow from "@/components/Team/Standings/StandingsRow";
import ZoneLegend from "@/components/Team/Standings/ZoneLegend";
import { STANDINGS_LAYOUT as L } from "@/components/Team/Standings/layout";
import {
  buildStandingsSections,
  type StandingsSection,
} from "@/components/Team/Standings/zones";
import Colors from "@/constants/colors";
import { REAL_MADRID_TEAM_ID } from "@/constants/football";
import { useStandings } from "@/hooks/football/queries";

/**
 * The La Liga table on Home, rendered natively.
 *
 * This replaced an api-sports WebView embed. The embed shipped its own teal
 * accent, its own typeface and its own column widths, so it always read as a
 * third-party panel dropped into the page — and it could not mark Real Madrid.
 *
 * Everything here is the Team tab's standings kit (`components/Team/Standings`)
 * so the two tables cannot drift apart: same row, same column constants, same
 * zone parsing, same legend. What Home leaves out is the interaction — the
 * competition and season pickers, the All/Home/Away scope and the pinned row
 * all stay on the Team tab, which is what the heading's action links to.
 */
export default function LaLigaStandings() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isPending, isError, refetch } = useStandings();

  const rows = useMemo(() => data ?? [], [data]);

  // Scope is always the overall table here, so zones are meaningful and the
  // competition name is fixed — this block only ever shows La Liga.
  const built = useMemo(
    () => buildStandingsSections(rows, COMPETITION_NAME),
    [rows],
  );

  // Nothing to show and nothing to explain: don't leave an empty block behind.
  if (!isPending && !isError && rows.length === 0) return null;

  return (
    <View className="bg-bg-medium py-4">
      <View style={{ paddingHorizontal: L.outerPadding }}>
        {/* No "see all" action: the whole table is already here, so a link
            next to it just repeated the heading. The Team tab is where the
            competition, season and Home/Away controls live, and it is one tap
            away in the tab bar. */}
        <SectionHeading title={t("home.laLigaStandings")} />
      </View>

      {isPending ? (
        <View className="py-10 items-center">
          <ActivityIndicator color={Colors.darkGold} />
        </View>
      ) : isError ? (
        <ErrorState title={t("team.errorStandings")} onRetry={refetch} compact />
      ) : (
        <View>
          <StandingsHeaderRow />

          {built.sections.map((section) => (
            <View key={section.key}>
              <ZoneHeader section={section} />
              <View style={{ paddingHorizontal: L.outerPadding }}>
                <SurfaceCard
                  padded={false}
                  style={{
                    borderRadius: 12,
                    // One card per band, so a run of rows reads as a single
                    // block and the card's own borders draw the hairlines.
                  }}
                >
                  {section.data.map((row, index) => (
                    <View
                      key={row.team.id}
                      style={
                        index > 0
                          ? {
                              borderTopWidth: 1,
                              borderTopColor: Colors.border.default,
                            }
                          : undefined
                      }
                    >
                      <StandingsRow
                        row={row}
                        rank={row.rank}
                        played={row.all.played}
                        goalsDiff={row.goalsDiff}
                        points={row.points}
                        zoneColor={section.color}
                        isOwnTeam={row.team.id === REAL_MADRID_TEAM_ID}
                        onPress={() =>
                          router.push(
                            (row.team.id === REAL_MADRID_TEAM_ID
                              ? "/team"
                              : `/team/${row.team.id}`) as never,
                          )
                        }
                        accessibilityLabel={t("team.a11yStandingRow", {
                          team: row.team.name,
                          rank: row.rank,
                          points: row.points,
                        })}
                      />
                    </View>
                  ))}
                </SurfaceCard>
              </View>
            </View>
          ))}

          <ZoneLegend sections={built.sections} />
        </View>
      )}
    </View>
  );
}

/** This block only ever renders La Liga, so the name is fixed rather than fetched. */
const COMPETITION_NAME = "La Liga";

/**
 * The band label. Same rule as the Team tab: a recognised zone uses its
 * translated label, anything unrecognised shows the API's own wording, because
 * an untranslated but truthful label beats a confidently wrong one.
 */
function ZoneHeader({ section }: { section: StandingsSection }) {
  const { t } = useTranslation();

  const label =
    section.stageLabel ??
    (section.labelKey ? t(section.labelKey) : section.rawDescription);

  if (!label) return <View style={{ height: 10 }} />;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: L.outerPadding,
        paddingTop: 14,
        paddingBottom: 6,
      }}
    >
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
        {label}
      </Text>
    </View>
  );
}
