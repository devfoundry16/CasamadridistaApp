import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { articles } from "@/mocks/articles";
import { Player, Coach, TeamInfo } from "@/interfaces/profile";
import { NextMatch } from "@/interfaces/match";
import ProfileApiService from "@/services/profileApi";
import MatchApiService from "@/services/matchApi";
type Theme = "light" | "dark";

export const [AppProvider, useApp] = createContextHook(() => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [players, setPlayers] = useState<Array<Player>>([]);
  const [coach, setCoach] = useState<Coach>();
  const [teamInfo, setTeamInfo] = useState<TeamInfo>();
  const [nextMatch, setNextMatch] = useState<NextMatch>();

  const loadAppData = useCallback(async () => {
    try {
      const playersString = await AsyncStorage.getItem("players");
      let savedPlayers: Array<Player>;
      if (playersString) {
        savedPlayers = JSON.parse(playersString);
        setPlayers(savedPlayers);
      }

      const coachString = await AsyncStorage.getItem("coach");
      let coach: Coach;
      if (coachString) {
        coach = JSON.parse(coachString);
        setCoach(coach);
      }

      const teamString = await AsyncStorage.getItem("team");
      let team: TeamInfo;
      if (teamString) {
        team = JSON.parse(teamString);
        setTeamInfo(team);
      }

      console.log("[App] Data loaded");
    } catch (error) {
      console.error("[App] Failed to load data:", error);
    }
  }, []);

  useEffect(() => {
    loadAppData();
    // return () => subscription.remove();
  }, [loadAppData]);

  const filteredArticles = useMemo(() => {
    if (selectedCategory === "all") return articles;
    return articles.filter((article) => article.category === selectedCategory);
  }, [selectedCategory]);

  const featuredArticles = useMemo(() => {
    return articles.slice(0, 3);
  }, []);

  const latestArticles = useMemo(() => {
    return articles.slice(0, 6);
  }, []);

  const fetchProfileData = useCallback(
    async (name: string) => {
      //fetch Players
      const teamInfo = await ProfileApiService.fetchTeamInfo(541);
      let squads = await ProfileApiService.fetchSquad(teamInfo.id);
      setTeamInfo(teamInfo);
      let newPlayers: Array<Player> = [];
      for (const player of squads) {
        const playerData: Player = await ProfileApiService.fetchProfile(
          player.id
        );
        const birthFlag = await ProfileApiService.fetchCountryFlag(
          playerData.birth.country
        );
        const countryFlag = await ProfileApiService.fetchCountryFlag(
          playerData.nationality
        );
        newPlayers.push({
          ...playerData,
          number: player.number,
          birth: {
            date: playerData.birth.date,
            place: playerData.birth.place,
            country: playerData.birth.country,
            flag: birthFlag,
          },
          flag: countryFlag,
        });
      }
      setPlayers(newPlayers);
      let ch = await ProfileApiService.fetchCoachProfile(teamInfo.id);
      const birthFlag = await ProfileApiService.fetchCountryFlag(
        ch.birth.country
      );
      const countryFlag = await ProfileApiService.fetchCountryFlag(
        ch.nationality
      );
      let newCoach = {
        ...ch,
        birth: {
          date: ch.birth.date,
          place: ch.birth.place,
          country: ch.birth.country,
          flag: birthFlag,
        },
        flag: countryFlag,
      };
      setCoach(newCoach);
      await AsyncStorage.setItem("players", JSON.stringify(newPlayers));
      await AsyncStorage.setItem("coach", JSON.stringify(newCoach));
      await AsyncStorage.setItem("team", JSON.stringify(teamInfo));
    },
    [players, coach, teamInfo]
  );

  const fetchNextMatchData = useCallback(
    async (id: number) => {
      const data: any = await MatchApiService.fetchNextMatch(id);
      setNextMatch(data);
    },
    [nextMatch]
  );

  return useMemo(
    () => ({
      articles,
      selectedCategory,
      setSelectedCategory,
      filteredArticles,
      featuredArticles,
      latestArticles,
      players,
      coach,
      teamInfo,
      nextMatch,
      fetchProfileData,
      fetchNextMatchData,
    }),
    [
      articles,
      selectedCategory,
      setSelectedCategory,
      filteredArticles,
      featuredArticles,
      latestArticles,
      players,
      coach,
      teamInfo,
      nextMatch,
      fetchProfileData,
      fetchNextMatchData,
    ]
  );
});
