import CustomWebView from "@/components/CustomWebView";
import QuoteSection from "@/components/QuoteSection";
import SquadSection from "@/components/SquadSection";
import StrengthSection from "@/components/StrengthSection";
import UpcomingForm from "@/components/UpcomingForm";
import UpcomingMatchesCarousel from "@/components/UpcomingMatchCard";
import VisionSection from "@/components/VisionSection";
import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";

import MatchApiService from "@/services/matchApi";
import { Match } from "@/types/match";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = 280;

export default function HomeScreen() {
  const router = useRouter();
  const { teamInfoList } = useApp();
  const [homeTeamLastMatches, setHomeTeamLastMatches] = useState<Match[]>([]);
  const [awayTeamLastMatches, setAwayTeamLastMatches] = useState<Match[]>([]);
  const RealMadridId = 541;

  const nextMatches = teamInfoList.find(
    (p) => p.team.id == RealMadridId
  )?.nextMatches;

  const lastMatches = teamInfoList.find(
    (p) => p.team.id == RealMadridId
  )?.lastMatches;

  const matches = [...(nextMatches ?? []), ...(lastMatches ?? [])];
  const nextMatch = nextMatches?.at(0);
  const [strengthSectionY, setStrengthSectionY] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  const handleStrengthSectionLayout = (event: any) => {
    const { y } = event.nativeEvent.layout;
    setStrengthSectionY(y);
  };
  const mainScrollY = useRef(0);


  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    mainScrollY.current = scrollY;

    if (!hasAnimated && strengthSectionY > 0) {
      const viewportHeight = Dimensions.get("window").height;
      const triggerPoint = strengthSectionY - viewportHeight * 0.7;

      if (scrollY >= triggerPoint) {
        setShouldAnimate(true);
        setHasAnimated(true);
      }
    }
  };

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
                          data-league="140" 
                          data-season="2025"
                        ></api-sports-widget>

                        <script type="module" src="https://widgets.api-sports.io/3.1.0/widgets.js"></script>
                      </body>
                    </html>
                  `;

  const loadInitialData = async () => {
    try {
      //fetchProfileData(RealMadridId);
      MatchApiService.fetchNextMatch(RealMadridId).then((result) => {
        MatchApiService.fetchLastMatches(result.teams.home.id).then((data) => {
          setHomeTeamLastMatches(data);
        });
        MatchApiService.fetchLastMatches(result.teams.away.id).then((data) => {
          setAwayTeamLastMatches(data);
        });
      });
    } catch (error) {
      console.error("[App] Failed to load initial data:", error);
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      loadInitialData();
    };
    fetchData();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
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
            onPress={() => router.push("/memberships/royal-investor")}
          >
            <Text style={[styles.loginButtonText, { color: Colors.textWhite }]}>
              Become a Member
            </Text>
          </Pressable>

          <View style={styles.content}>
            <View style={styles.nextMatchSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming</Text>
                {nextMatch && (
                  <UpcomingForm
                    nextMatch={nextMatch}
                    homeTeamLastMatches={homeTeamLastMatches}
                    awayTeamLastMatches={awayTeamLastMatches}
                  />
                )}
              </View>
            </View>
          </View>
        </View>
        <UpcomingMatchesCarousel data={matches} />
      </View>

      <CustomWebView
        size={700}
        title="La Liga Standings"
        statsHtml={statsHtml}
      />
      <StrengthSection
        shouldAnimate={shouldAnimate}
        handleStrengthSectionLayout={handleStrengthSectionLayout}
      />
      <VisionSection />
      <SquadSection />
      <QuoteSection />
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkGray,
  },
  header: {
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
  content: {
    width: "90%",
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    marginBottom: 15,
  },
  accentLine: {
    height: 3,
    width: 40,
    backgroundColor: Colors.accent,
    borderRadius: 2,
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
  nextMatchSection: {
    marginBottom: 24,
  },
});
