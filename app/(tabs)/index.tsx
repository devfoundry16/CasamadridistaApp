/* eslint-disable react-hooks/exhaustive-deps */
import CustomWebView from "@/components/CustomWebView";
import FanClubPartnershipSection from "@/components/FanClubPartnershipSection";
import HomePartnershipBanner from "@/components/HomePartnershipBanner";
import QuoteSection from "@/components/Home/QuoteSection";
import StrengthSection from "@/components/Home/StrengthSection";
import OffSeasonMatchCard from "@/components/Home/OffSeasonMatchCard";
import UpcomingMatchesCarousel from "@/components/Home/UpcomingMatchCard";
import VisionSection from "@/components/Home/VisionSection";
import { Spinner } from "@/components/Spinner";
import UpcomingForm from "@/components/UpcomingForm";
import { useFootball } from "@/hooks/useFootball";
import { useEnvironment } from "@/hooks/useEnvironment";
import { ENABLE_HOME_PARTNERSHIP_BANNER } from "@/constants/partnerships";

import MatchService from "@/services/Football/MatchService";
import { Match } from "@/types/soccer/match";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Text } from "@/components/Text";
import { Alert, Dimensions, Pressable, ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { teamInfoList, fetchProfileData, fetchLiveMatchData, isLoading } =
    useFootball();
  const { apiSports, football } = useEnvironment();
  const [homeTeamLastMatches, setHomeTeamLastMatches] = useState<Match[]>([]);
  const [awayTeamLastMatches, setAwayTeamLastMatches] = useState<Match[]>([]);
  const RealMadridId = 541;
  const [liveMatch, setLiveMatch] = useState<Match>();
  const [isLive, setIsLive] = useState<boolean>(false);

  const nextMatches = teamInfoList.find(
    (p) => p.team.id === RealMadridId,
  )?.nextMatches;

  const lastMatches = teamInfoList.find(
    (p) => p.team.id === RealMadridId,
  )?.lastMatches;

  const hasUpcomingMatches = (nextMatches?.length ?? 0) > 0;
  const nextMatch = nextMatches?.at(0);
  const carouselMatches = hasUpcomingMatches
    ? (nextMatches ?? [])
    : (lastMatches ?? []);
  const carouselVariant = hasUpcomingMatches ? "upcoming" : "recent";
  const realMadridTeam = teamInfoList.find(
    (p) => p.team.id === RealMadridId,
  )?.team;
  const seasonYear = Number(football.currentSeason);
  const nextSeasonLabel = `${seasonYear}-${seasonYear + 1}`;
  const isOffSeason = !liveMatch && !hasUpcomingMatches;
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
                          data-key="${apiSports.apiKey || ""}"
                          data-sport="football"
                          data-theme="grey"
                          data-show-logos="true"
                        ></api-sports-widget>

                       <api-sports-widget 
                          data-type="standings" 
                          data-league="140" 
                          data-season="${football.currentSeason}"
                        ></api-sports-widget>

                        <script type="module" src="https://widgets.api-sports.io/3.1.0/widgets.js"></script>
                      </body>
                    </html>
                  `;

  const checkLiveMatch = useCallback(async () => {
    try {
      const liveMatchData = await fetchLiveMatchData(RealMadridId);

      // Check if match is actually live based on fixture status
      if (liveMatchData && liveMatchData.fixture?.status) {
        const status = liveMatchData.fixture.status.short;
        // Match is live if status is: 1H, 2H, HT, ET, P, BT, LIVE, or if elapsed time exists
        const isMatchLive =
          status === "1H" ||
          status === "2H" ||
          status === "HT" ||
          status === "ET" ||
          status === "P" ||
          status === "BT" ||
          status === "LIVE" ||
          (liveMatchData.fixture.status.elapsed != null &&
            liveMatchData.fixture.status.elapsed > 0);

        if (isMatchLive) {
          setLiveMatch(liveMatchData);
          setIsLive(true);
        } else {
          // Match is not live anymore
          setLiveMatch(undefined);
          setIsLive(false);
        }
      } else {
        // No live match found
        setLiveMatch(undefined);
        setIsLive(false);
      }
    } catch (error: any) {
      // If error, don't show alert for every failed check, just log it
      console.log("Live match check failed:", error.message);
      // Only clear live match if we're sure there's no match
      setLiveMatch(undefined);
      setIsLive(false);
    }
  }, [fetchLiveMatchData, RealMadridId]);

  const loadInitialData = useCallback(async () => {
    try {
      if (teamInfoList.length && !isLive) fetchProfileData(RealMadridId);
      MatchService.fetchNextMatch(RealMadridId).then((result) => {
        if (!result?.teams) return;
        MatchService.fetchLastMatches(result.teams.home.id).then((data) => {
          setHomeTeamLastMatches(data);
        });
        MatchService.fetchLastMatches(result.teams.away.id).then((data) => {
          setAwayTeamLastMatches(data);
        });
      });
    } catch (error: any) {
      Alert.alert(
        t("common.error"),
        error.message || t("common.failedToLoadData"),
      );
    }
  }, []);

  // Initial check for live match on mount
  useEffect(() => {
    checkLiveMatch();
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData, isLive]);

  // When there's a live match, fetch last 5 matches for the LIVE match's teams (not the "next" match's teams)
  useEffect(() => {
    if (
      liveMatch?.teams?.home?.id != null &&
      liveMatch?.teams?.away?.id != null
    ) {
      MatchService.fetchLastMatches(liveMatch.teams.home.id).then((data) => {
        setHomeTeamLastMatches(data);
      });
      MatchService.fetchLastMatches(liveMatch.teams.away.id).then((data) => {
        setAwayTeamLastMatches(data);
      });
    }
  }, [liveMatch]);

  // Poll for live match updates every 15 seconds
  useEffect(() => {
    const timer = setInterval(checkLiveMatch, 15000); // Check every 15 seconds
    return () => {
      clearInterval(timer);
    };
  }, [checkLiveMatch]);

  useEffect(() => {
    setHasAnimated(false);
    setShouldAnimate(false);
  }, [teamInfoList, fetchProfileData]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-deep-dark">
        <Spinner content={t("common.loadingContext")} />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-bg-gray"
      showsVerticalScrollIndicator={false}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      {ENABLE_HOME_PARTNERSHIP_BANNER && <HomePartnershipBanner />}
      <View className="items-center">
        <Image
          source={{
            uri: "https://casamadridista.com/wp-content/uploads/2025/09/435345345.webp",
          }}
          style={{
            width: Dimensions.get("window").width,
            height: 778,
          }}
          contentFit="cover"
        />
        <View className="absolute left-0 right-0 items-center pb-[300px] pt-[10%]">
          <Text className="text-[25px] font-bold text-center text-white mb-3.5">
            {t("home.fanClub")}
          </Text>
          <Text className="text-lg text-white opacity-80 text-center">
            {t("home.joinLargest")}
          </Text>
          <Pressable
            className="py-3.5 px-3 rounded-xl items-center mt-6 bg-rm-gold"
            onPress={() => router.push("/memberships/royal-investor")}
          >
            <Text className="text-base font-semibold text-white">
              {t("home.becomeMember")}
            </Text>
          </Pressable>

          <View className="w-[90%] p-4">
            <View className="mb-6">
              <View className="flex-col items-center justify-center mb-4 mt-5">
                <Text className="text-lg font-bold text-white mb-3.5">
                  {liveMatch
                    ? liveMatch.fixture.status.long +
                      ` ${liveMatch.fixture.status.elapsed != null ? liveMatch.fixture.status.elapsed + "' " + t("home.elapsed") : ""}` +
                      (liveMatch.fixture.status.extra != null
                        ? ` ${t("home.extraTime")} ${liveMatch.fixture.status.extra}'`
                        : "")
                    : isOffSeason
                      ? t("home.seasonBreak")
                      : t("home.upcoming")}
                </Text>
                {liveMatch ? (
                  <UpcomingForm
                    setLive={setIsLive}
                    nextMatch={liveMatch}
                    homeTeamLastMatches={homeTeamLastMatches}
                    awayTeamLastMatches={awayTeamLastMatches}
                  />
                ) : nextMatch ? (
                  <UpcomingForm
                    setLive={setIsLive}
                    nextMatch={nextMatch}
                    homeTeamLastMatches={homeTeamLastMatches}
                    awayTeamLastMatches={awayTeamLastMatches}
                  />
                ) : (
                  isOffSeason && (
                    <OffSeasonMatchCard
                      teamId={RealMadridId}
                      teamName={realMadridTeam?.name ?? t("player.realMadrid")}
                      teamLogo={
                        realMadridTeam?.logo ??
                        "https://media.api-sports.io/football/teams/541.png"
                      }
                      lastMatches={lastMatches ?? []}
                      nextSeasonLabel={nextSeasonLabel}
                    />
                  )
                )}
              </View>
            </View>
          </View>
        </View>
        <UpcomingMatchesCarousel
          data={carouselMatches}
          variant={carouselVariant}
        />
      </View>

      <CustomWebView
        size={700}
        title={t("home.laLigaStandings")}
        statsHtml={statsHtml}
      />
      <StrengthSection
        shouldAnimate={shouldAnimate}
        handleStrengthSectionLayout={handleStrengthSectionLayout}
      />
      <FanClubPartnershipSection variant="home" />
      <VisionSection />
      {/* <SquadSection /> */}
      <QuoteSection />
    </ScrollView>
  );
}
