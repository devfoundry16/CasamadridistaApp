import CustomWebView from "@/components/CustomWebView";
import UpcomingForm from "@/components/UpcomingForm";
import UpcomingMatchesCarousel from "@/components/UpcomingMatchCard";
import Colors from "@/constants/colors";
import { useApp } from "@/contexts/AppContext";
import { quotes, squadPlayers, strengthStats } from "@/mocks/advertisement";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Users } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";

const { width } = Dimensions.get("window");
const CARD_WIDTH = 280;

export default function HomeScreen() {
  const router = useRouter();
  const { teamInfoList, homeTeamLastMatches, awayTeamLastMatches } = useApp();

  const RealMadridId = 541;

  const nextMatches = teamInfoList.find(
    (p) => p.team.id == RealMadridId
  )?.nextMatches;

  const lastMatches = teamInfoList.find(
    (p) => p.team.id == RealMadridId
  )?.lastMatches;

  const matches = [...(nextMatches ?? []), ...(lastMatches ?? [])];

  const nextMatch = nextMatches?.at(0);

  const quoteCarouselRef = useRef<any>(null);
  const playerCarouseRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  const [strengthSectionY, setStrengthSectionY] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  const mainScrollY = useRef(0);

 
  const getIcon = (iconName: string) => {
    const iconProps = { width: 156, height: 156 };
    switch (iconName) {
      case "users":
        return (
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/09/4324324234.webp",
            }}
            contentFit="cover"
            style={iconProps}
          />
        );
      case "gift":
        return (
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/09/323423424.webp",
            }}
            contentFit="cover"
            style={iconProps}
          />
        );
      case "calendar":
        return (
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/09/34y467346.webp",
            }}
            contentFit="cover"
            style={iconProps}
          />
        );
      case "heart":
        return (
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/09/324245324231.webp",
            }}
            contentFit="cover"
            style={iconProps}
          />
        );
      default:
        return <Users {...iconProps} />;
    }
  };
  const handlePrev = () => {
    if (playerCarouseRef.current) {
      playerCarouseRef.current.prev();
    }
  };

  const handleNext = () => {
    if (playerCarouseRef.current) {
      playerCarouseRef.current.next();
    }
  };

  const handleNextQuote = () => {
    if (quoteCarouselRef.current) {
      quoteCarouselRef.current.next();
    }
  };

  const handlePrevQuote = () => {
    if (quoteCarouselRef.current) {
      quoteCarouselRef.current.prev();
    }
  };

  const handleStrengthSectionLayout = (event: any) => {
    const { y } = event.nativeEvent.layout;
    setStrengthSectionY(y);
  };

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
    const fetchData = async () => {};
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

      <CustomWebView size={700} title="La Liga Standings" statsHtml={statsHtml} />
      <CustomWebView size={600} title="Team stats" statsHtml={standingHTML} />

      <View
        style={styles.adStrengthSection}
        onLayout={handleStrengthSectionLayout}
      >
        <View style={styles.adSectionHeader}>
          <View style={styles.adHeaderLine} />
          <Text style={styles.adSectionTitle}>Our Strength</Text>
          <View style={styles.adHeaderLine} />
        </View>
        <Text style={styles.adSectionSubtitle}>Madridista spirit united</Text>

        <View style={styles.adStatsContainer}>
          {strengthStats.map((stat, index) => (
            <AnimatedStat
              key={index}
              stat={stat}
              icon={getIcon(stat.icon)}
              shouldAnimate={shouldAnimate}
            />
          ))}
        </View>
      </View>

      <View style={styles.adVisionSection}>
        <Image
          source={{
            uri: "https://casamadridista.com/wp-content/uploads/2025/05/ban-3.png",
          }}
          style={styles.adVisionImage}
          contentFit="cover"
        />
        <View style={styles.adVisionOverlay}>
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/09/4234324324.webp",
            }}
            style={styles.adFanPlayerImage}
            contentFit="cover"
          />
          <Text style={styles.adVisionTitle}>
            Got a Vision? Let&apos;s Talk It Through
          </Text>
          <Text style={styles.adVisionSubtitle}>
            Your Ideas Matter Share Them with Us
          </Text>
          <TouchableOpacity
            style={styles.adContactButton}
            onPress={() => router.push("/contact")}
          >
            <Text style={styles.adContactButtonText}>Contact Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.adSquadSection}>
        <View style={styles.adSectionHeader}>
          <View style={styles.adHeaderLine} />
          <Text style={styles.adSectionTitle}>Players Squad</Text>
          <View style={styles.adHeaderLine} />
        </View>

        <View style={styles.quoteNavigationButtons}>
          <TouchableOpacity style={styles.quoteNavButton} onPress={handlePrev}>
            <ChevronLeft size={20} color={Colors.accent} />
          </TouchableOpacity>
          <Carousel
            ref={playerCarouseRef}
            width={width - 140}
            height={350}
            data={squadPlayers}
            renderItem={({ item }) => (
              <View key={item.id} style={styles.adPlayerCard}>
                <Image
                  source={{ uri: item.photo }}
                  style={styles.adPlayerImage}
                  contentFit="cover"
                />
                <View style={styles.adPlayerNameContainer}>
                  <Text style={styles.adPlayerName}>{item.name}</Text>
                </View>
              </View>
            )}
            onSnapToItem={(index) => setCurrentIndex(index)}
            loop
            autoPlay={true}
            autoPlayInterval={5000}
            scrollAnimationDuration={500}
          />
          <TouchableOpacity style={styles.quoteNavButton} onPress={handleNext}>
            <ChevronRight size={20} color={Colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.adHeadSection}>
        <Image
          source={{
            uri: "https://casamadridista.com/wp-content/uploads/2025/05/img3.png",
          }}
          style={styles.adHeadBackgroundImage}
          contentFit="cover"
        />

        <View style={styles.adHeadContent}>
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/09/43534535.webp",
            }}
            style={styles.adPlayerActionImage}
            contentFit="fill"
          />
          <View style={styles.adQuoteContainer}>
            <View style={styles.quoteNavigationButtons}>
              <TouchableOpacity
                style={{
                  ...styles.quoteNavButton,
                  borderColor: Colors.primary,
                }}
                onPress={handlePrevQuote}
              >
                <ChevronLeft size={20} color={Colors.primary} />
              </TouchableOpacity>
              <Carousel
                ref={quoteCarouselRef}
                width={width - 140}
                height={500}
                data={quotes}
                renderItem={({ item }) => (
                  <View style={styles.adQuoteCard}>
                    <Image
                      source={{ uri: item.photo }}
                      style={styles.adHeadPhoto}
                      contentFit="cover"
                    />
                    <Text style={styles.adQuote}>{item.text}</Text>
                    <Text style={styles.adHeadName}>{item.author}</Text>
                    <Text style={styles.adHeadTitle}>{item.role}</Text>
                  </View>
                )}
                onSnapToItem={(index) => setCurrentQuoteIndex(index)}
                loop
                autoPlay={true}
                autoPlayInterval={5000}
                scrollAnimationDuration={500}
              />
              <TouchableOpacity
                style={{
                  ...styles.quoteNavButton,
                  borderColor: Colors.primary,
                }}
                onPress={handleNextQuote}
              >
                <ChevronRight size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
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
  infoSection: {
    marginBottom: 24,
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
  matchCard: {
    borderColor: Colors.lightGray,
    borderWidth: 1,
    padding: 8,
    paddingHorizontal: 16,
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
    gap: 6,
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
  },
  adPlayerImage: {
    width: "100%",
    height: "100%",
  },
  adStrengthSection: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: "#2a2a2a",
    marginHorizontal: -16,
  },
  adSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  adHeaderLine: {
    width: 70,
    height: 2,
    backgroundColor: Colors.accent,
    marginHorizontal: 40,
  },
  adSectionTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    textAlign: "center",
  },
  adSectionSubtitle: {
    fontSize: 16,
    color: Colors.accent,
    textAlign: "center",
    marginBottom: 30,
  },
  adStatsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    gap: 15,
  },
  adStatCard: {
    width: (width - 80) / 2,
    alignItems: "center",
    padding: 15,
  },
  adIconContainer: {
    marginBottom: 12,
  },
  adStatValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    marginBottom: 6,
  },
  adStatLabel: {
    fontSize: 14,
    color: Colors.accent,
    textAlign: "center",
  },
  adVisionSection: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: 500,
  },
  adVisionImage: {
    width: "100%",
    height: "100%",
  },
  adFanPlayerImage: {
    width: "80%",
    height: 300,
  },
  adVisionOverlay: {
    position: "absolute" as const,
    alignItems: "center" as const,
  },
  adVisionTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    textAlign: "center",
    marginBottom: 8,
  },
  adVisionSubtitle: {
    fontSize: 14,
    color: Colors.textWhite,
    textAlign: "center",
    marginBottom: 20,
  },
  adContactButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  adContactButtonText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#1a1a1a",
  },
  adSquadSection: {
    paddingVertical: 40,
    backgroundColor: "#2a2a2a",
    marginHorizontal: -16,
  },
  adSquadHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  adPlayerCard: {
    width: CARD_WIDTH,
    height: 320,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#2a2a2a",
  },
  adPlayerNameContainer: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 16,
  },
  adPlayerName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    textAlign: "center",
  },
  adHeadSection: {
    height: 900,
    width: "100%",
    flexDirection: "column" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  adHeadBackgroundImage: {
    width: "100%",
    height: "100%",
  },
  adHeadContent: {
    position: "absolute" as const,
    alignItems: "center" as const,
  },
  adPlayerActionImage: {
    width: "100%",
    height: 322,
  },
  adQuoteContainer: {
    flexDirection: "row",
  },
  adQuoteCard: {
    padding: 16,
    alignItems: "center",
  },
  adHeadPhoto: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: Colors.accent,
  },
  adQuote: {
    fontSize: 15,
    color: Colors.textWhite,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 18,
  },
  adHeadName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    marginBottom: 4,
    fontStyle: "italic",
  },
  adHeadTitle: {
    fontSize: 12,
    color: Colors.accent,
  },
  quoteNavigationButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 12,
  },
  quoteNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  quoteIndicators: {
    flexDirection: "row",
    gap: 6,
  },
  quoteIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  quoteIndicatorActive: {
    backgroundColor: Colors.accent,
    width: 24,
  },
});

interface AnimatedStatProps {
  stat: {
    icon: string;
    value: number;
    suffix: string;
    label: string;
    color: string;
  };
  icon: React.ReactElement;
  shouldAnimate: boolean;
}

function AnimatedStat({ stat, icon, shouldAnimate }: AnimatedStatProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shouldAnimate) {
      Animated.timing(animatedValue, {
        toValue: stat.value,
        duration: 2000,
        useNativeDriver: false,
      }).start();

      const listener = animatedValue.addListener(({ value }) => {
        setDisplayValue(Math.floor(value));
      });

      return () => {
        animatedValue.removeListener(listener);
      };
    }
  }, [shouldAnimate, stat.value, animatedValue]);

  return (
    <View style={styles.adStatCard}>
      <View style={styles.adIconContainer}>{React.cloneElement(icon)}</View>
      <Text style={styles.adStatValue}>
        {displayValue.toLocaleString()}
        {stat.suffix}
      </Text>
      <Text style={styles.adStatLabel}>{stat.label}</Text>
    </View>
  );
}
