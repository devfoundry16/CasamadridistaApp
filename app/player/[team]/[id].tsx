import CustomWebView from "@/components/CustomWebView";
import countries from "@/constants/countries.json";
import { useFootball } from "@/hooks/useFootball";
import { useEnvironment } from "@/hooks/useEnvironment";
import { CountryMap } from "@/types/soccer/profile";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/Text";
import { ScrollView, View } from "react-native";
import CountryFlag from "react-native-country-flag";

const map: CountryMap = countries;
export default function PlayerDetailScreen() {
  const { t } = useTranslation();
  const { team, id } = useLocalSearchParams();
  const { playersList } = useFootball();
  const { apiSports } = useEnvironment();

  const teamId = Number(team);
  const playerId = Number(id);

  const players = playersList.find((p) => p.team.id == teamId);
  const player = players
    ? players.player?.find((p) => p.id == playerId)
    : undefined;

  useEffect(() => {
    const fetchData = async () => {
      // player = await SportsInfoService.fetchProfile(Number(id));
      const teamIDs = playersList.map((players) => players.team.id);
    };
    fetchData();
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
                            background-color: transparent;
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
                          data-type="player" 
                          data-player-id="${player?.id}"
                          data-player-statistics="true"
                          data-player-injuries="true"
                          data-player-trophies="true"
                          data-season="AFL"
                        ></api-sports-widget>  
                        <script type="module" src="https://widgets.api-sports.io/3.1.0/widgets.js"></script>
                      </body>
                    </html>
                  `;

  return (
    <>
      <ScrollView className="flex-1 bg-bg-medium" showsVerticalScrollIndicator={false}>
        <View className="pt-10 pb-10 px-5 items-center">
          <Image
            source={{ uri: player?.photo }}
            style={{ width: 140, height: 140, borderRadius: 70 }}
            className="border-4 border-rm-gold mb-4 bg-bg-light"
            contentFit="cover"
          />
          <Text className="text-[28px] font-bold text-rm-gold mb-1 text-center">{player?.name}</Text>
          <Text className="text-base text-white opacity-90 uppercase tracking-wider">{player?.position}</Text>
        </View>

        <View className="p-4">
          <View className="mb-6">
            <Text className="text-xl font-bold text-rm-gold mb-3 pl-1">{t("player.playerInformation")}</Text>
            <View className="rounded-xl p-4 pt-0">
              <View className="flex-row justify-between items-center py-3">
                <Text className="text-sm text-white font-medium">{t("player.fullName")}</Text>
                <Text className="text-sm text-white font-semibold">{player?.name}</Text>
              </View>
              <View className="h-px bg-border-default" />
              <View className="flex-row justify-between items-center py-3">
                <Text className="text-sm text-white font-medium">{t("player.position")}</Text>
                <Text className="text-sm text-white font-semibold">{player?.position}</Text>
              </View>
              <View className="h-px bg-border-default" />
              <View className="flex-row justify-between items-center py-3">
                <Text className="text-sm text-white font-medium">{t("player.number")}</Text>
                <Text className="text-sm text-white font-semibold">{player?.number}</Text>
              </View>
              <View className="h-px bg-border-default" />
              <View className="flex-row justify-between items-center py-3">
                <Text className="text-sm text-white font-medium">{t("player.age")}</Text>
                <Text className="text-sm text-white font-semibold">{player?.age}</Text>
              </View>
              <View className="h-px bg-border-default" />
              <View className="flex-row justify-between items-center py-3">
                <Text className="text-sm text-white font-medium">{t("player.nationality")}</Text>
                {player?.nationality && map[player?.nationality] ? (
                  <CountryFlag isoCode={map[player?.nationality]} size={25} />
                ) : null}
              </View>
              <View className="h-px bg-border-default" />
              <View className="flex-row justify-between items-center py-3">
                <Text className="text-sm text-white font-medium">{t("player.placeOfBirth")}</Text>
                <View className="flex-row justify-center items-center">
                  <Text className="text-sm text-white font-semibold">{player?.birth.place} </Text>
                  {player?.birth.country && map[player?.birth.country] ? (
                    <CountryFlag
                      isoCode={map[player?.birth.country]}
                      size={25}
                    />
                  ) : null}
                </View>
              </View>
              <View className="h-px bg-border-default" />
              <View className="flex-row justify-between items-center py-3">
                <Text className="text-sm text-white font-medium">{t("player.dateOfBirth")}</Text>
                <Text className="text-sm text-white font-semibold">{player?.birth.date}</Text>
              </View>
              <View className="h-px bg-border-default" />
              <View className="flex-row justify-between items-center py-3">
                <Text className="text-sm text-white font-medium">{t("player.weight")}</Text>
                <Text className="text-sm text-white font-semibold">{player?.weight}</Text>
              </View>
              <View className="h-px bg-border-default" />
              <View className="flex-row justify-between items-center py-3">
                <Text className="text-sm text-white font-medium">{t("player.height")}</Text>
                <Text className="text-sm text-white font-semibold">{player?.height}</Text>
              </View>
            </View>
          </View>

          <CustomWebView
            size={600}
            statsHtml={statsHtml}
            title={t("player.playerStats")}
          />
        </View>
      </ScrollView>
    </>
  );
}
