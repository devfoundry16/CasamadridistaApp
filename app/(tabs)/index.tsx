import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { WebView } from "react-native-webview";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Clock, ChevronRight, MapPinned, Calendar } from "lucide-react-native";
import { useApp } from "@/contexts/AppContext";
import Colors from "@/constants/colors";
import { useEffect, useState } from "react";
import { upcomingMatches } from "@/mocks/team";

export default function HomeScreen() {
  const router = useRouter();
  const { nextMatch, fetchNextMatchData, lastMatches, fetchLastMatchesData } =
    useApp();
  const [timeLeft, setTimeLeft] = useState<string>("");

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
                          data-key="2efab6a210831868664529f16d897809"
                          data-sport="football"
                          data-theme="grey"
                          data-show-logos="true"
                        ></api-sports-widget>

                       <api-sports-widget 
                          data-type="standings" 
                          data-league="140" 
                          data-season="2025"
                        ></api-sports-widget>

                        <script type="module" src="https://widgets.api-sports.io/3.1.0/widgets.js"></script>
                      </body>
                    </html>
                  `;

  const standingHTML = ` 
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
                          data-key="2efab6a210831868664529f16d897809"
                          data-sport="football"
                          data-theme="grey"
                          data-show-logos="true"
                        ></api-sports-widget>

                       <api-sports-widget 
                          data-type="league" 
                          data-league="140"
                          data-refresh="20"
                        ></api-sports-widget>

                        <script type="module" src="https://widgets.api-sports.io/3.1.0/widgets.js"></script>
                      </body>
                    </html>
                  `;
  useEffect(() => {
    const fetchData = async () => {
      await fetchNextMatchData(541);
      await fetchLastMatchesData(541);
      console.log("Data Successfully Loaded");
    };
    fetchData();
  }, []);
  useEffect(() => {
    const calculateTimeLeft = async () => {
      const matchDateString: any = nextMatch?.fixture.date;
      const matchDateTime = new Date(matchDateString);
      const now = new Date();
      const difference = matchDateTime.getTime() - now.getTime();
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft("Match Started");
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [nextMatch]);
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Image
          source={{
            uri: "https://casamadridista.com/wp-content/uploads/2025/09/435345345.webp",
          }}
          style={styles.headerImage}
          contentFit="cover"
        />
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>REAL MADRID OFFICIAL FAN CLUB</Text>
          <Text style={styles.headerTagline}>
            Join the largest gathering of Madridistas in the world
          </Text>
          <Pressable
            style={[
              styles.loginButton,
              {
                backgroundColor: Colors.darkGold,
              },
            ]}
          >
            <Text style={[styles.loginButtonText, { color: Colors.textWhite }]}>
              Become a Member
            </Text>
          </Pressable>

          <View style={styles.content}>
            <View style={styles.nextMatchSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Next Match</Text>
              </View>

              <View style={styles.matchCard}>
                <View style={styles.nextMatchHeader}>
                  <View style={{ flexDirection: "column" }}>
                    <Text style={styles.nextMatchCompetition}>
                      {nextMatch?.league.name}
                    </Text>
                    <Text style={styles.nextMatchCompetition}>
                      {nextMatch?.league.round}
                    </Text>
                  </View>
                  <View style={styles.countdownContainer}>
                    <Clock size={16} color={Colors.primary} />
                    <Text style={styles.countdownText}>{timeLeft}</Text>
                  </View>
                </View>

                <View style={styles.nextMatchTeams}>
                  <TouchableOpacity
                    style={styles.nextMatchTeam}
                    onPress={() => router.push("/team")}
                  >
                    <Image
                      source={{ uri: nextMatch?.teams.home.logo }}
                      style={styles.nextMatchLogo}
                      contentFit="contain"
                    />
                    <Text style={styles.nextMatchTeamName}>
                      {nextMatch?.teams.home.name}
                    </Text>
                    <View style={styles.formContainer}>
                      {lastMatches.map((result, index) => (
                        <View
                          key={index}
                          style={[
                            styles.formBadge,
                            result.teams.home.winner && styles.formWin,
                            result.teams.home.winner ===
                              result.teams.away.winner && styles.formDraw,
                            !result.teams.home.winner && styles.formLoss,
                          ]}
                        ></View>
                      ))}
                    </View>
                  </TouchableOpacity>

                  <View style={styles.vsContainer}>
                    <Text style={styles.vsText}>{nextMatch?.goals.home}</Text>
                    <Text style={styles.vsText}>VS</Text>
                    <Text style={styles.vsText}>{nextMatch?.goals.away}</Text>
                  </View>

                  <TouchableOpacity style={styles.nextMatchTeam}>
                    <Image
                      source={{ uri: nextMatch?.teams.away.logo }}
                      style={styles.nextMatchLogo}
                      contentFit="contain"
                    />
                    <Text style={styles.nextMatchTeamName}>
                      {nextMatch?.teams.away.name}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.nextMatchDetails}>
                  <View style={styles.nextMatchDetailItem}>
                    <Calendar size={16} color={Colors.textWhite} />
                    <Text
                      style={{ ...styles.nextMatchDetailText, marginRight: 10 }}
                    >
                      {new Date(
                        nextMatch?.fixture.date as any
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  {nextMatch?.fixture.venue.name && (
                    <View style={styles.nextMatchDetailItem}>
                      <MapPinned size={16} color={Colors.textWhite} />
                      <Text style={styles.nextMatchDetailText}>
                        {nextMatch?.fixture.venue.name}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>

        {upcomingMatches.map((match, index) => (
          <View key={`upcoming-${index}`} style={styles.matchCard}>
            <View style={styles.matchHeader}>
              <Text style={styles.matchCompetition}>{match.competition}</Text>
              <Text style={styles.matchDateTime}>
                {new Date(match.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                • {match.time}
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
                <Text style={styles.vsTextSmall}>VS</Text>
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
            {match.stadium && (
              <View style={styles.matchStadium}>
                <MapPinned size={12} color={Colors.textWhite} />
                <Text style={styles.matchStadiumText}>{match.stadium}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}></Text>
        <View style={styles.widgetContainer}>
          <WebView
            source={{
              html: statsHtml,
            }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
          />
        </View>
      </View>
      <View>
        <Text style={styles.sectionTitle}></Text>
        <View style={styles.widgetContainer}>
          <WebView
            source={{
              html: standingHTML,
            }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
          />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Stories</Text>
          <View style={styles.accentLine} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkGray,
  },
  header: {
    paddingBottom: 30,
    alignItems: "center",
  },
  headerSection: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingBlockEnd: 300,
    paddingBlockStart: "10%",
  },
  headerImage: {
    width: "100%",
    height: 778,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "900" as const,
    color: Colors.textWhite,
    marginBottom: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
  headerSubtitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.textWhite,
    marginBottom: 4,
  },
  headerTagline: {
    fontSize: 18,
    color: Colors.textWhite,
    opacity: 0.8,
    fontStyle: "italic",
    textAlign: "center",
  },
  infoSection: {
    marginBottom: 24,
  },
  content: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.textWhite,
  },
  accentLine: {
    height: 3,
    width: 40,
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textWhite,
  },
  featuredCard: {
    height: 300,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: Colors.secondary,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  featuredGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    justifyContent: "flex-end",
  },
  categoryBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.secondary,
    letterSpacing: 1,
  },
  featuredTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    marginBottom: 8,
    lineHeight: 30,
  },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featuredMetaText: {
    fontSize: 12,
    color: Colors.accent,
  },
  featuredGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  featuredSmallCard: {
    flex: 1,
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.secondary,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  featuredSmallImage: {
    width: "100%",
    height: "100%",
  },
  featuredSmallGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    justifyContent: "flex-end",
  },
  featuredSmallTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textWhite,
    lineHeight: 18,
  },
  newsCard: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  newsImage: {
    width: 120,
    height: 120,
  },
  newsContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  newsCategory: {
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  newsCategoryText: {
    fontSize: 9,
    fontWeight: "600" as const,
    color: Colors.royalBlue,
    letterSpacing: 0.5,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text,
    lineHeight: 18,
    marginBottom: 4,
  },
  newsExcerpt: {
    fontSize: 12,
    color: Colors.textLight,
    lineHeight: 16,
    marginBottom: 6,
  },
  newsMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  newsMetaText: {
    fontSize: 10,
    color: Colors.textLight,
  },
  loginButton: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  widgetContainer: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    overflow: "hidden",
    height: 500,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 12,
  },
  webview: {
    backgroundColor: "transparent",
  },
  matchCard: {
    borderColor: Colors.lightGray,
    borderWidth: 1,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  matchCompetition: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  matchDateTime: {
    fontSize: 11,
    color: Colors.textWhite,
  },
  matchContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  teamContainer: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  teamLogo: {
    width: 40,
    height: 40,
  },
  teamName: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textWhite,
    textAlign: "center",
  },
  scoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
  },
  score: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.textWhite,
  },
  scoreSeparator: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.textWhite,
  },
  nextMatchSection: {
    marginBottom: 24,
  },
  nextMatchCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  nextMatchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  nextMatchCompetition: {
    fontSize: 14,
    marginRight: 10,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countdownText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.textWhite,
  },
  nextMatchTeams: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  nextMatchTeam: {
    flex: 1,
    alignItems: "center",
    gap: 12,
  },
  nextMatchLogo: {
    width: 70,
    height: 70,
  },
  nextMatchTeamName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    textAlign: "center",
  },
  vsContainer: {
    paddingHorizontal: 16,
  },
  vsText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    letterSpacing: 2,
  },
  nextMatchDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  nextMatchDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  nextMatchDetailText: {
    fontSize: 12,
    color: Colors.textWhite,
    fontWeight: "600" as const,
  },
  vsTextSmall: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.textWhite,
  },
  matchStadium: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  matchStadiumText: {
    fontSize: 11,
    color: Colors.textWhite,
  },
  formContainer: {
    flexDirection: "row",
    gap: 4,
    marginTop: 6,
  },
  formBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  formWin: {
    backgroundColor: "#10b981",
  },
  formDraw: {
    backgroundColor: "#f59e0b",
  },
  formLoss: {
    backgroundColor: "#ef4444",
  },
  formText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.textWhite,
  },
});
