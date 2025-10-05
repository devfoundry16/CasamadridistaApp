import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { articles } from "@/mocks/articles";
import {
  Coach,
  TeamInfo,
  PlayerWithTeam,
  CoachWithTeam,
} from "@/interfaces/profile";
import { NextMatch, LastMatch } from "@/interfaces/match";
import ProfileApiService from "@/services/profileApi";
import MatchApiService from "@/services/matchApi";
import * as Bluebird from "bluebird";
type Theme = "light" | "dark";

export const [AppProvider, useApp] = createContextHook(() => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [playersList, setPlayersList] = useState<PlayerWithTeam[]>([]);
  const [coachList, setCoachList] = useState<CoachWithTeam[]>([]);
  const [teamInfoList, setTeamInfoList] = useState<TeamInfo[]>([]);
  const [nextMatch, setNextMatch] = useState<NextMatch>();
  const [lastMatches, setLastMatches] = useState<Array<LastMatch>>([]);

  const loadAppData = useCallback(async () => {
    try {
      //AsyncStorage.clear(); // for testing only, remove in production
      const playersString = await AsyncStorage.getItem("players");
      let savedPlayersList: PlayerWithTeam[];
      if (playersString) {
        savedPlayersList = JSON.parse(playersString);
        const teamIDs = savedPlayersList.map(players => players.team.id)
        console.log("loaded players:", teamIDs);
        setPlayersList(savedPlayersList);
      }

      const coachString = await AsyncStorage.getItem("coaches");
      let coachList: CoachWithTeam[];
      if (coachString) {
        coachList = JSON.parse(coachString);
        console.log("loaded coaches:", coachList.length);
        setCoachList(coachList);
      }

      const teamString = await AsyncStorage.getItem("teams");
      let teamList: TeamInfo[];
      if (teamString) {
        teamList = JSON.parse(teamString);
        console.log("loaded teams:", teamList.length);
        setTeamInfoList(teamList);
      }

      //fetchProfileData(541);
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
    async (id: number) => {
      const index = teamInfoList.findIndex((p) => p.team.id === id); // index = -1 not found

      //teamInfo
      const teamInfo = await ProfileApiService.fetchTeamInfo(id);
      let squads = await ProfileApiService.fetchSquad(teamInfo.team.id);

      const newTeamInfoList = index == -1 ? [...teamInfoList, teamInfo] : [...teamInfoList.slice(0, index), teamInfo, ...teamInfoList.slice(index + 1)];

      //coachList
      const coach = await ProfileApiService.fetchCoachProfile(teamInfo.team.id);
      const newCoachList = index == -1 ? [
        ...coachList,
        { team: { id }, player: coach },
      ] : [
        ...coachList.slice(0, index),
        { team: { id }, player: coach },
        ...coachList.slice(index + 1),
      ];

      setTeamInfoList(newTeamInfoList);
      setCoachList(newCoachList);
      AsyncStorage.setItem("teams", JSON.stringify(newTeamInfoList));
      AsyncStorage.setItem("coaches", JSON.stringify(newCoachList));

      //playersList
      Bluebird.Promise.map(
        squads.players,
        (player: { id: number }) => ProfileApiService.fetchProfile(player.id),
        { concurrency: 5 }
      ).then((data: any) => {
        let newPlayersList;
        if (index == -1) {
          newPlayersList = [
            ...playersList,
            {
              player: data,
              team: {
                id,
              },
            },
          ];
        } else {
          newPlayersList = [
            ...playersList.slice(0, index),
            {
              player: data,
              team: {
                id,
              },
            },
            ...playersList.slice(index + 1),
          ];
        }
        setPlayersList(newPlayersList);
        AsyncStorage.setItem("players", JSON.stringify(newPlayersList));
      });
    },
    [playersList, coachList, teamInfoList]
  );

  const fetchNextMatchData = useCallback(
    async (id: number) => {
      const data: any = await MatchApiService.fetchNextMatch(id);
      setNextMatch(data);
    },
    [nextMatch]
  );
  const fetchLastMatchesData = useCallback(
    async (id: number) => {
      const data: any = await MatchApiService.fetchLastMatches(id);
      setLastMatches(data);
    },
    [lastMatches]
  );
  return useMemo(
    () => ({
      articles,
      selectedCategory,
      setSelectedCategory,
      filteredArticles,
      featuredArticles,
      latestArticles,
      playersList,
      coachList,
      teamInfoList,
      nextMatch,
      lastMatches,
      fetchProfileData,
      fetchNextMatchData,
      fetchLastMatchesData,
    }),
    [
      articles,
      selectedCategory,
      setSelectedCategory,
      filteredArticles,
      featuredArticles,
      latestArticles,
      playersList,
      coachList,
      teamInfoList,
      nextMatch,
      lastMatches,
      fetchProfileData,
      fetchNextMatchData,
      fetchLastMatchesData,
    ]
  );
});
