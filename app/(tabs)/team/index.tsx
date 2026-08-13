import React, { useMemo } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";
import Colors from "@/constants/colors";
import { useFootball } from "@/hooks/useFootball";
import { useSeasonFixtures } from "@/hooks/football/queries";
import { useSeason } from "@/hooks/football/useSeason";
import { REAL_MADRID_TEAM_ID } from "@/constants/football";
import SectionHeading from "@/components/Team/SectionHeading";
import SurfaceCard from "@/components/Team/SurfaceCard";
import EmptyState from "@/components/Team/EmptyState";
import ErrorState from "@/components/Team/ErrorState";
import NextMatchHero from "@/components/Team/NextMatchHero";
import FormStrip from "@/components/Team/FormStrip";
import TeamDetailsPanel from "@/components/Team/TeamDetailsPanel";
import OffSeasonMatchCard from "@/components/Home/OffSeasonMatchCard";
import {
  byDateAsc,
  isFinished,
  isInPlay,
  isScheduled,
} from "@/components/Team/matchUtils";

const TEAM_ID = REAL_MADRID_TEAM_ID;

export default function TeamDetailsTab() {
  const { t } = useTranslation();
  const { teamInfoList } = useFootball();
  const season = useSeason();
  const teamInfo = teamInfoList.find((x) => x.team.id === TEAM_ID);

  const { data: fixtures, isPending, isError, refetch } = useSeasonFixtures(TEAM_ID);

  const { featured, recent } = useMemo(() => {
    const all = [...(fixtures ?? [])].sort(byDateAsc);
    const live = all.find(isInPlay);
    const next = all.find(isScheduled);
    const played = all.filter(isFinished);
    return {
      featured: live ?? next ?? played[played.length - 1],
      recent: played.slice(-5),
    };
  }, [fixtures]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background.deepDark }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {isPending ? (
        <View className="py-10 items-center">
          <ActivityIndicator color={Colors.darkGold} />
        </View>
      ) : isError ? (
        <SurfaceCard padded={false}>
          <ErrorState title={t("team.errorMatches")} onRetry={refetch} compact />
        </SurfaceCard>
      ) : featured ? (
        <NextMatchHero match={featured} watermarkUri={teamInfo?.team?.logo} />
      ) : (
        <OffSeasonMatchCard
          teamId={TEAM_ID}
          teamName={teamInfo?.team?.name ?? ""}
          teamLogo={teamInfo?.team?.logo ?? ""}
          lastMatches={recent}
          nextSeasonLabel={`${season}/${String(season + 1).slice(-2)}`}
        />
      )}

      {recent.length > 0 ? (
        <View>
          <SectionHeading title={t("team.recentForm")} />
          <SurfaceCard>
            <FormStrip matches={recent} teamId={TEAM_ID} />
          </SurfaceCard>
        </View>
      ) : !isPending && !isError ? (
        <View>
          <SectionHeading title={t("team.recentForm")} />
          <SurfaceCard>
            <EmptyState title={t("team.emptyForm")} />
          </SurfaceCard>
        </View>
      ) : null}

      <TeamDetailsPanel teamInfo={teamInfo} />
    </ScrollView>
  );
}
