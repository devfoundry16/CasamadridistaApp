import CustomWebView from "@/components/CustomWebView";
import Colors from "@/constants/colors";
import countries from "@/constants/countries.json";
import { useApp } from "@/contexts/AppContext";
import { CountryMap } from "@/types/profile";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import CountryFlag from "react-native-country-flag";

const map: CountryMap = countries;
export default function PlayerDetailScreen() {
  const { team, id } = useLocalSearchParams();
  const { playersList } = useApp();

  const teamId = Number(team);
  const playerId = Number(id);

  const players =  playersList.find((p) => p.team.id == teamId);
  const player = players ? players.player?.find((p) => p.id == playerId) : undefined;

  useEffect(() => {
    const fetchData = async () => {
      // player = await ProfileApiService.fetchProfile(Number(id));
      const teamIDs = playersList.map((players) => players.team.id);

      console.log("loaded players on player/[id].tsx:", teamIDs);
      console.log("fetch player data on player/[id].tsx");
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
                          data-key="2efab6a210831868664529f16d897809"
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
      <Stack.Screen
        options={{
          title: player?.name,
          headerStyle: { backgroundColor: Colors.secondary },
          headerTintColor: Colors.primary,
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image
            source={{ uri: player?.photo }}
            style={styles.playerPhoto}
            contentFit="cover"
          />
          <Text style={styles.playerName}>{player?.name}</Text>
          <Text style={styles.playerPosition}>{player?.position}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Player Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{player?.name}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Position</Text>
                <Text style={styles.infoValue}>{player?.position}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Number</Text>
                <Text style={styles.infoValue}>{player?.number}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Age</Text>
                <Text style={styles.infoValue}>{player?.age}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nationality</Text>
                {player?.nationality && map[player?.nationality] ? (
                  <CountryFlag isoCode={map[player?.nationality]} size={25} />
                ) : null}
              </View>
              <View style={styles.divider} />
              <View style={{ ...styles.infoRow }}>
                <Text style={styles.infoLabel}>Place of Birth</Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={styles.infoValue}>{player?.birth.place} </Text>
                  {player?.birth.country && map[player?.birth.country] ? (
                    <CountryFlag
                      isoCode={map[player?.birth.country]}
                      size={25}
                    />
                  ) : null}
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date Of Birth</Text>
                <Text style={styles.infoValue}>{player?.birth.date}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Weight</Text>
                <Text style={styles.infoValue}>{player?.weight}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Height</Text>
                <Text style={styles.infoValue}>{player?.height}</Text>
              </View>
            </View>
          </View>

          <CustomWebView size={600} statsHtml={statsHtml} title="Player Stats"/>
          

        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deepDarkGray,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  playerPhoto: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: Colors.primary,
    marginBottom: 16,
    backgroundColor: Colors.lightGray,
  },
  playerName: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.darkGold,
    marginBottom: 4,
    textAlign: "center",
  },
  playerPosition: {
    fontSize: 16,
    color: Colors.textWhite,
    opacity: 0.9,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  playerCountryImage: {
    width: 50,
    height: 30,
    marginLeft: 10,
    backgroundColor: "transparent",
  },
  content: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 8,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textWhite,
    fontWeight: "500" as const,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.textWhite,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.darkGold,
    marginBottom: 12,
    paddingLeft: 4,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    paddingTop: 0,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textWhite,
    fontWeight: "500" as const,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.textWhite,
    fontWeight: "600" as const,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  clubCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  clubLogo: {
    width: 60,
    height: 60,
    marginRight: 16,
  },
  clubInfo: {
    flex: 1,
  },
  clubName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    marginBottom: 4,
  },
  clubSubtitle: {
    fontSize: 14,
    color: Colors.textWhite,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textWhite,
    textAlign: "center",
    marginTop: 40,
  },
});
