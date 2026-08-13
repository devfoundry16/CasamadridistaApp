import React, { useEffect } from "react";
import { ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";
import Colors from "@/constants/colors";
import { Spinner } from "@/components/Spinner";
import { useFootball } from "@/hooks/useFootball";
import TeamIdentityHeader from "./TeamIdentityHeader";
import TeamDetailsPanel from "./TeamDetailsPanel";
import SquadList from "./SquadList";

/**
 * Opponent teams get a plain profile, not the six-tab treatment.
 *
 * Standings is league-scoped (so it's the same table), Top players is
 * league-wide (so it's identical for every team), and team-statistics plus the
 * season fixture list are per-team — six tabs for every opponent a user taps
 * would be unbounded upstream cost with almost no cache reuse. The only entry
 * points here are the crests on a fixture card and the league team grid, which
 * are "who are we playing?" intents.
 */
export default function OpponentTeamProfile({ teamId }: { teamId: number }) {
  const { t } = useTranslation();
  const { playersList, teamInfoList, fetchProfileData } = useFootball();

  const teamInfo = teamInfoList.find((x) => x.team.id === teamId);
  const squad = playersList.find((p) => p.team.id === teamId);
  const hasSquad = (squad?.player?.length ?? 0) > 0;

  useEffect(() => {
    // fetchProfileData is useCallback-stable in useFootball, so listing it here
    // does not re-trigger; hasSquad flips false -> true once and the guard stops
    // the second run.
    if (!hasSquad) {
      fetchProfileData(teamId);
    }
  }, [teamId, hasSquad, fetchProfileData]);

  if (!teamInfo) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: Colors.background.deepDark,
        }}
      >
        <Spinner content={t("team.loadingSquads")} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>
      <TeamIdentityHeader teamInfo={teamInfo} />
      <ScrollView
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 32, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 16 }}>
          <TeamDetailsPanel teamInfo={teamInfo} />
        </View>
        <SquadList teamId={teamId} showMetricChips={false} />
      </ScrollView>
    </View>
  );
}
