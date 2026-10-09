import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import SegmentedToggle from "@/components/Team/SegmentedToggle";
import ChipRow from "./ChipRow";
import { POSITIONS, type LeaderMode, type LeaderScope, type Position } from "@/utils/topPlayers.core";

type PositionKey = "ALL" | Position;

interface Props {
  scope: LeaderScope;
  onScope: (scope: LeaderScope) => void;
  position: Position | null;
  onPosition: (position: Position | null) => void;
  mode: LeaderMode;
  onMode: (mode: LeaderMode) => void;
  /** Off on a "See all" page whose stat has only one mode. */
  showMode?: boolean;
}

/** Real Madrid / Entire competition, the position line, and Totals / Per 90. */
export default function PlayerFilters({ scope, onScope, position, onPosition, mode, onMode, showMode = true }: Props) {
  const { t } = useTranslation();
  return (
    <View style={{ gap: 10 }}>
      <SegmentedToggle<LeaderScope>
        options={[
          { key: "team", label: t("team.leaders.scopeTeam") },
          { key: "all", label: t("team.leaders.scopeAll") },
        ]}
        value={scope}
        onChange={onScope}
      />
      <ChipRow<PositionKey>
        options={[
          { key: "ALL", label: t("team.leaders.positionAll") },
          ...POSITIONS.map((p) => ({ key: p, label: t(`team.leaders.position.${p}`) })),
        ]}
        value={position ?? "ALL"}
        onChange={(key) => onPosition(key === "ALL" ? null : key)}
      />
      {showMode ? (
        <SegmentedToggle<LeaderMode>
          options={[
            { key: "total", label: t("team.leaders.modeTotal") },
            { key: "per90", label: t("team.leaders.modePer90") },
          ]}
          value={mode}
          onChange={onMode}
        />
      ) : null}
    </View>
  );
}
