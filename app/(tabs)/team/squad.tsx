import React from "react";
import { ScrollView } from "react-native";
import Colors from "@/constants/colors";
import SquadList from "@/components/Team/SquadList";
import { REAL_MADRID_TEAM_ID } from "@/constants/football";

export default function TeamSquadTab() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.background.deepDark }}
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <SquadList teamId={REAL_MADRID_TEAM_ID} />
    </ScrollView>
  );
}
