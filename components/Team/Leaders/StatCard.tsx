import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/Text";
import Colors from "@/constants/colors";
import SectionHeading from "@/components/Team/SectionHeading";
import SurfaceCard from "@/components/Team/SurfaceCard";
import { RowDivider } from "./LeaderRow";

interface Props {
  title: string;
  /** The minimum minutes behind this ranking, when one applies. */
  minMinutes?: number | null;
  onSeeAll: () => void;
  children: React.ReactNode[];
}

/** One stat: its heading with "See all", the top rows, and the threshold that applied. */
export default function StatCard({ title, minMinutes, onSeeAll, children }: Props) {
  const { t } = useTranslation();
  return (
    <View>
      <SectionHeading
        title={title}
        // 21 cards each say "See all"; a screen reader needs to hear which.
        action={{ label: t("team.leaders.seeAll"), onPress: onSeeAll, accessibilityLabel: `${t("team.leaders.seeAll")}, ${title}` }}
      />
      <SurfaceCard padded={false}>
        {children.map((row, i) => (
          <View key={i}>
            {row}
            {i < children.length - 1 ? <RowDivider /> : null}
          </View>
        ))}
      </SurfaceCard>
      {minMinutes ? (
        <Text className="text-[11px]" style={{ color: Colors.text.muted, marginTop: 6, marginHorizontal: 4 }}>
          {t("team.leaders.minMinutes", { minutes: minMinutes })}
        </Text>
      ) : null}
    </View>
  );
}
