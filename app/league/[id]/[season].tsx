import CustomWebView from "@/components/CustomWebView";
import Colors from "@/constants/colors";
import ProfileApiService from "@/services/profileApi";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const LeagueDetailScreen = () => {
  const router = useRouter();
  const { id, season } = useLocalSearchParams();
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
                          data-key="2efab6a210831868664529f16d897809"
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
        const teamsList = await ProfileApiService.fetchTeamsInLeague(
          Number(id),
          Number(season)
        );
        setTeams(teamsList);

        const league = await ProfileApiService.fetchLeagueById(Number(id));
        setLeague(league.league);
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };
    fetchTeams();
  }, []);
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View>
        {/* Render league name */}
        <Text style={styles.leagueName}>
          {league?.name} {season}-{Number(season) + 1}
        </Text>
        {/* Render league logo */}
        {league && (
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Image source={{ uri: league.logo }} style={styles.leagueLogo} />
          </View>
        )}
        {/* Render team logos */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            marginVertical: 10,
          }}
        >
          {teams.map((team) => (
            <View key={team.team.id} style={styles.teamView}>
              <TouchableOpacity style={styles.teamLogo} onPress={() => router.push(`/team/${team.team.id}`)}>
                <Image source={{ uri: team.team.logo }} style={styles.logo} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deepDarkGray,
  },
  logo: { width: 30, height: 30, resizeMode: "contain" },
  leagueLogo: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    marginBottom: 10,
  },
  leagueName: {
    color: Colors.textWhite,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  teamView: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  teamLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: Colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
  },
});
