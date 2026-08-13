import React from "react";
import { Redirect, useLocalSearchParams } from "expo-router";
import OpponentTeamProfile from "@/components/Team/OpponentTeamProfile";
import { REAL_MADRID_TEAM_ID } from "@/constants/football";

export default function TeamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const teamId = Number(id);

  // Real Madrid already has a first-class six-tab home in the bottom tab bar.
  // Without this, tapping the RM crest on a fixture card opened a second,
  // subtly different copy of the same page.
  if (teamId === REAL_MADRID_TEAM_ID) return <Redirect href="/team" />;

  return <OpponentTeamProfile teamId={teamId} />;
}
