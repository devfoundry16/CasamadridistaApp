import MatchService from "@/services/Football/MatchService";
import SportsInfoService from "@/services/Football/SportsInfoService";
import {
  CoachWithTeam,
  PlayerWithTeam,
  TeamInfo,
} from "@/types/soccer/profile";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Bluebird from "bluebird";
import { useCallback, useEffect, useMemo, useState } from "react";
type Theme = "light" | "dark";
const RealMadridId = 541;
export const [AppProvider, useApp] = createContextHook(() => {
  const [playersList, setPlayersList] = useState<PlayerWithTeam[]>([]);
  const [coachList, setCoachList] = useState<CoachWithTeam[]>([]);
  const [teamInfoList, setTeamInfoList] = useState<TeamInfo[]>([]);

  const loadAppData = useCallback(async () => {
    try {
      console.log("---------App Context---------");
      //AsyncStorage.clear(); // for testing only, remove in production
      const playersString = await AsyncStorage.getItem("players");
      let savedPlayersList: PlayerWithTeam[];
      if (playersString) {
        savedPlayersList = JSON.parse(playersString);
        console.log("saved players list:", savedPlayersList.length);
        const teamIDs = savedPlayersList.map((players) => players.team.id);
        console.log("loaded teamIds:", teamIDs);
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
      // fetchProfileData(RealMadridId);
      console.log("[App] Data loaded");
    } catch (error) {
      console.error("[App] Failed to load data:", error);
    }
  }, []);

  useEffect(() => {
    loadAppData().then((data) => {
      //fetchProfileData(RealMadridId);
    });
    // return () => subscription.remove();
  }, [loadAppData]);

  const fetchNextMatchData = useCallback(async (id: number) => {
    return MatchService.fetchNextMatch(id);
  }, []);

  const fetchLiveMatchData = useCallback(async (id: number) => {
    return MatchService.fetchLiveMatch(id);
  }, []);

  const fetchProfileData = useCallback(
    async (id: number) => {
      console.log("AppContext: before teaminfo list", teamInfoList.length);
      const index = teamInfoList.findIndex((p) => p.team.id === id); // index = -1 not found

      //teamInfo
      const teamInfo = await SportsInfoService.fetchTeamInfo(id);
      let nextMatches = await MatchService.fetchUpcomingMatches(id);
      let lastMatches = await MatchService.fetchLastMatches(id);
      teamInfo.nextMatches = nextMatches.slice();
      teamInfo.lastMatches = lastMatches.slice();

      let squads = await SportsInfoService.fetchSquad(id);

      const newTeamInfoList =
        index == -1
          ? [...teamInfoList, teamInfo]
          : [
              ...teamInfoList.slice(0, index),
              teamInfo,
              ...teamInfoList.slice(index + 1),
            ];

      console.log("AppContext: teaminfo list", newTeamInfoList.length);
      //coachList
      const coach = await SportsInfoService.fetchCoachProfile(teamInfo.team.id);
      const newCoachList =
        index == -1
          ? [...coachList, { team: { id }, player: coach }]
          : [
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
        (player: { id: number }) => SportsInfoService.fetchProfile(player.id),
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

  return useMemo(
    () => ({
      playersList,
      coachList,
      teamInfoList,
      fetchProfileData,
      fetchLiveMatchData,
    }),
    [playersList, coachList, teamInfoList, fetchProfileData, fetchLiveMatchData]
  );
});
