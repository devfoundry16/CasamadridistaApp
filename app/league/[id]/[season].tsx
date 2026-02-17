import CustomWebView from "@/components/CustomWebView";
import { Spinner } from "@/components/Spinner";
import { useEnvironment } from "@/hooks/useEnvironment";
import SportsInfoService from "@/services/Football/SportsInfoService";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const LeagueDetailScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(true);
  const { id, season } = useLocalSearchParams();
  const { apiSports } = useEnvironment();
  const [teams, setTeams] = React.useState<any[]>([]);
  const [league, setLeague] = React.useState<any>(null);
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
                          data-type="standings"
                          data-league=${id}
                          data-season=${season}
                        ></api-sports-widget>
                        <script type="module" src="https://widgets.api-sports.io/3.1.0/widgets.js"></script>
                      </body>
                    </html>
                  `;
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsList = await SportsInfoService.fetchTeamsInLeague(
          Number(id),
          Number(season)
        );
        setTeams(teamsList);
        const league = await SportsInfoService.fetchLeagueById(Number(id));
        setLeague(league.league);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };
    fetchTeams();
  }, []);
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-medium">
        <Spinner content={t("league.loading")} />
      </View>
    )
  }
  return (
    <ScrollView className="flex-1 bg-bg-medium" showsVerticalScrollIndicator={false}>
      <View>
        {/* Render league name */}
        <Text className="text-white text-2xl font-bold text-center my-2.5">
          {league?.name} {season}-{Number(season) + 1}
        </Text>
        {/* Render league logo */}
        {league && (
          <View className="justify-center items-center">
            <Image source={{ uri: league.logo }} style={{ width: 80, height: 80 }} className="mb-2.5" resizeMode="contain" />
          </View>
        )}
        {/* Render team logos */}
        <View className="flex-row justify-center items-center flex-wrap gap-2.5 my-2.5">
          {teams.map((team) => (
            <View key={team.team.id} className="w-[50px] h-[50px] justify-center items-center">
              <TouchableOpacity
                className="w-10 h-10 rounded-[20px] overflow-hidden bg-bg-light justify-center items-center"
                onPress={() => router.push(`/team/${team.team.id}`)}
              >
                <Image source={{ uri: team.team.logo }} style={{ width: 30, height: 30 }} resizeMode="contain" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
      <CustomWebView size={800} title={`Standing`} statsHtml={statsHtml} />
    </ScrollView>
  );
};

export default LeagueDetailScreen;
