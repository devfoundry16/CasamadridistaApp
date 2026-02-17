import countries from "@/constants/countries.json";
import {
  Coach,
  CoachWithTeam,
  CountryMap,
  Player,
} from "@/types/soccer/profile";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Building2, Calendar, MapPin } from "lucide-react-native";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import CustomWebView from "@/components/CustomWebView";
import { useFootball } from "@/hooks/useFootball";
import { useEnvironment } from "@/hooks/useEnvironment";
import CountryFlag from "react-native-country-flag";
import { Spinner } from "@/components/Spinner";
const map: CountryMap = countries;

export default function TeamDetailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const teamId = Number(id);
  const { apiSports } = useEnvironment();

  const { playersList, coachList, teamInfoList, fetchProfileData, isLoading } =
    useFootball();

  const players = playersList.find((p) => p.team.id === teamId) ?? {
    player: [],
    team: {},
  };

  const coachWithTeam: CoachWithTeam = coachList.find(
    (c) => c.team.id === teamId
  ) ?? { player: {} as Coach, team: { id: 0 } };

  const coach: Player = coachWithTeam.player;

  const teamInfo = teamInfoList.find((t) => t.team.id === teamId);

  const goalkeepers = players.player.filter((p) => p.position === "Goalkeeper");
  const defenders = players.player.filter((p) => p.position === "Defender");
  const midfielders = players.player.filter((p) => p.position === "Midfielder");
  const forwards = players.player.filter((p) => p.position === "Attacker");

  useEffect(() => {
    if (players.player.length === 0) {
      fetchProfileData(teamId); // Default Real Madrid team ID
    }
  }, []);

  const statsHtml = `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                          body {
                            margin: 0;
                            padding: 0;
                            background-color: transparent;
                          }
                          api-sports-widget {
                            background-color: none;
                          }
                        </style>
                      </head>
                      <body>
                        <api-sports-widget
                          data-type="config"
                          data-key="${apiSports.apiKey || ""}"
                          data-sport="football"
                          data-theme="grey"
                          data-show-logos="true"
                        ></api-sports-widget>

                        <api-sports-widget 
                          data-type="team" 
                          data-team-id=${teamId}
                          data-team-squad="true"
                          data-team-statistics="true"
                          data-team-venue="true"
                        ></api-sports-widget>
                        <script type="module" src="https://widgets.api-sports.io/3.1.0/widgets.js"></script>
                      </body>
                    </html>
                  `;

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-medium">
        <Spinner content={t("team.loadingSquads")} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        className="flex-1 bg-bg-medium"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pb-4 pt-3 border-b border-border-default bg-bg-medium">
          <Image
            source={{
              uri: teamInfo?.team?.logo,
            }}
            style={{ width: 120, height: 120, marginHorizontal: "auto", marginBottom: 3 }}
            contentFit="contain"
            className="mx-auto mb-3"
          />
          <Text className="text-[28px] font-bold text-white mb-1 text-center">
            {teamInfo?.team?.name} {t("team.squad")}
          </Text>
          <Text className="text-sm text-white text-center">
            {t("team.season", { season: "2024-2025" })}
          </Text>
        </View>
        <View className="p-4">
          <View className="mb-6">
            <View className="flex-col justify-around">
              <View className="flex-row items-center m-1.5 gap-2">
                <MapPin size={20} color="#FFFFFF" />
                <Text className="text-xs text-text-tertiary font-medium">{t("team.country")}</Text>
                {teamInfo?.team?.country && map[teamInfo.team.country] ? (
                  <CountryFlag isoCode={map[teamInfo.team.country]} size={25} />
                ) : null}
              </View>
              <View className="flex-row items-center m-1.5 gap-2">
                <Calendar size={20} color="#FFFFFF" />
                <Text className="text-xs text-text-tertiary font-medium">{t("team.founded")}</Text>
                <Text className="text-base text-white font-bold">{teamInfo?.team?.founded}</Text>
              </View>
              <TouchableOpacity
                className="flex-row items-center m-1.5 gap-2"
                onPress={() => {
                  if (teamInfo?.venue?.id) {
                    router.push(`/venue/${teamInfo.venue.id}`);
                  }
                }}
              >
                <Building2 size={20} color="#FFFFFF" />
                <Text className="text-xs text-text-tertiary font-medium">{t("team.stadium")}</Text>
                <Text className="text-base text-white font-bold">{teamInfo?.venue?.name}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-col justify-between mb-4 mt-2">
            <Text className="text-[22px] font-bold text-white">{t("team.squad")}</Text>
            <View className="h-[1.5px] w-full bg-border-default rounded" />
          </View>

          <View className="mb-6">
            <View className="bg-rm-gold pl-4">
              <Text className="text-lg font-semibold text-white py-1.5">{t("team.goalkeepers")}</Text>
            </View>
            {goalkeepers.map((player: Player) => (
              <View key={player.id}>
                <PlayerCard
                  player={player}
                  onPress={() =>
                    router.push(`/player/${teamId}/${player.id}` as any)
                  }
                />
                <View className="h-[1.5px] w-full bg-border-default rounded" />
              </View>
            ))}
          </View>

          <View className="mb-6">
            <View className="bg-rm-gold pl-4">
              <Text className="text-lg font-semibold text-white py-1.5">{t("team.defenders")}</Text>
            </View>
            {defenders.map((player: Player) => (
              <View key={player.id}>
                <PlayerCard
                  player={player}
                  onPress={() =>
                    router.push(`/player/${teamId}/${player.id}` as any)
                  }
                />
                <View className="h-[1.5px] w-full bg-border-default rounded" />
              </View>
            ))}
          </View>

          <View className="mb-6">
            <View className="bg-rm-gold pl-4">
              <Text className="text-lg font-semibold text-white py-1.5">{t("team.midfielders")}</Text>
            </View>
            {midfielders.map((player: Player) => (
              <View key={player.id}>
                <PlayerCard
                  player={player}
                  onPress={() =>
                    router.push(`/player/${teamId}/${player.id}` as any)
                  }
                />
                <View className="h-[1.5px] w-full bg-border-default rounded" />
              </View>
            ))}
          </View>

          <View className="mb-6">
            <View className="bg-rm-gold pl-4">
              <Text className="text-lg font-semibold text-white py-1.5">{t("team.forwards")}</Text>
            </View>
            {forwards.map((player: Player) => (
              <View key={player.id}>
                <PlayerCard
                  player={player}
                  onPress={() =>
                    router.push(`/player/${teamId}/${player.id}` as any)
                  }
                />
                <View className="h-[1.5px] w-full bg-border-default rounded" />
              </View>
            ))}
          </View>
          <View className="mb-6">
            <View className="bg-rm-gold pl-4">
              <Text className="text-lg font-semibold text-white py-1.5">{t("team.coach")}</Text>
            </View>
            {coach && (
              <View>
                <PlayerCard
                  player={coach}
                  onPress={() => router.push(`/coach/${coach.id}` as any)}
                />
                <View className="h-[1.5px] w-full bg-border-default rounded" />
              </View>
            )}
          </View>

          {/* <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Matches</Text>
            <View style={styles.accentLine} />
          </View> */}
          <CustomWebView size={600} statsHtml={statsHtml} title={t("team.teamStats")} />

          {/* {latestMatches.map((match, index) => (
            <View key={index} style={styles.matchCard}>
              <View style={styles.matchHeader}>
                <Text style={styles.matchCompetition}>{match.competition}</Text>
                <Text style={styles.matchDateTime}>
                  {match.date} • {match.time}
                </Text>
              </View>
              <View style={styles.matchContent}>
                <View style={styles.teamContainer}>
                  <Image
                    source={{ uri: match.homeTeam.logo }}
                    style={styles.teamLogo}
                    contentFit="contain"
                  />
                  <Text style={styles.teamName} numberOfLines={1}>
                    {match.homeTeam.name}
                  </Text>
                </View>
                <View style={styles.scoreContainer}>
                  <Text style={styles.score}>{match.homeTeam.score}</Text>
                  <Text style={styles.scoreSeparator}>-</Text>
                  <Text style={styles.score}>{match.awayTeam.score}</Text>
                </View>
                <View style={styles.teamContainer}>
                  <Image
                    source={{ uri: match.awayTeam.logo }}
                    style={styles.teamLogo}
                    contentFit="contain"
                  />
                  <Text style={styles.teamName} numberOfLines={1}>
                    {match.awayTeam.name}
                  </Text>
                </View>
              </View>
            </View>
          ))} */}
        </View>
      </ScrollView>
    </>
  );
}
function PlayerCard({
  player,
  onPress,
}: {
  player: Player | Coach;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity className="flex-row items-center rounded-xl p-3" onPress={onPress}>
      <View className="w-10 h-10 rounded-[20px] justify-center items-center mr-3">
        <Text className="text-[25px] font-bold text-white">{player.number}</Text>
      </View>
      <Image
        source={{ uri: player.photo }}
        style={{ width: 60, height: 60, borderRadius: 30, marginRight: 10 }}
        className="bg-bg-light"
        contentFit="cover"
      />
      <View className="flex-1 justify-center">
        <Text className="text-base font-semibold text-white mb-1">{player.name}</Text>
        <View className="flex-row items-center gap-1.5">
          {player.nationality && map[player.nationality] ? (
            <CountryFlag isoCode={map[player.nationality]} size={25} />
          ) : null}
          <Text className="text-xs font-bold text-white">{t("player.ageLabel")}</Text>
          <Text className="text-xs font-bold text-white">{t("player.ageYears", { age: player.age })}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
