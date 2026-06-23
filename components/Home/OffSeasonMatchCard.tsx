import TeamForm from "@/components/TeamForm";
import { Match } from "@/types/soccer/match";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/Text";
import { Image, Pressable, View } from "react-native";

interface OffSeasonMatchCardProps {
  teamId: number;
  teamName: string;
  teamLogo: string;
  lastMatches: Match[];
  nextSeasonLabel: string;
}

export default function OffSeasonMatchCard({
  teamId,
  teamName,
  teamLogo,
  lastMatches,
  nextSeasonLabel,
}: OffSeasonMatchCardProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View className="bg-bg-medium/50 rounded-2xl p-4 items-center justify-center w-full">
      <Text className="text-text-primary text-sm font-semibold text-center mb-1">
        {t("home.offSeasonSubtitle", { season: nextSeasonLabel })}
      </Text>
      <Text className="text-text-primary text-[11px] text-center mb-4 opacity-80">
        {t("home.offSeasonMessage")}
      </Text>

      <View className="items-center mb-4">
        <Image
          source={{ uri: teamLogo }}
          style={{ width: 72, height: 72 }}
          className="mb-2"
          resizeMode="contain"
        />
        <Text className="text-text-primary text-sm font-bold mb-2">{teamName}</Text>
        {lastMatches.length > 0 && (
          <>
            <Text className="text-text-primary text-[11px] mb-1.5 opacity-80">
              {t("home.recentForm")}
            </Text>
            <TeamForm matches={lastMatches} nextMatchTeamId={teamId} />
          </>
        )}
      </View>

      <Pressable
        className="py-2.5 px-5 rounded-xl bg-rm-gold"
        onPress={() => router.push("/team")}
      >
        <Text className="text-sm font-semibold text-white">{t("home.viewSquad")}</Text>
      </Pressable>
    </View>
  );
}
