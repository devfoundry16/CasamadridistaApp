// store/thunks/footballThunks.ts
import MatchService from "@/services/Football/MatchService";
import SportsInfoService from "@/services/Football/SportsInfoService";
import {
  CoachWithTeam,
  PlayerWithTeam,
  TeamInfo,
} from "@/types/soccer/profile";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  setCoachList,
  setLoading,
  setPlayersList,
  setTeamInfoList,
} from "../slices/footballSlice";
import { RootState } from "../store";

const RealMadridId = 541;

// Load app data from storage
export const loadAppData = createAsyncThunk(
  "football/loadAppData",
  async (_, { dispatch }) => {
    try {
      const playersString = await AsyncStorage.getItem("players");
      if (playersString) {
        const savedPlayersList: PlayerWithTeam[] = JSON.parse(playersString);
        dispatch(setPlayersList(savedPlayersList));
      }

      const coachString = await AsyncStorage.getItem("coaches");
      if (coachString) {
        const coachList: CoachWithTeam[] = JSON.parse(coachString);
        dispatch(setCoachList(coachList));
      }

      const teamString = await AsyncStorage.getItem("teams");
      if (teamString) {
        const teamList: TeamInfo[] = JSON.parse(teamString);
        dispatch(setTeamInfoList(teamList));
      }
    } catch (error) {
      console.error("[Redux Football] Failed to load data:", error);
      throw error;
    }
  }
);

// Fetch profile data for a team
export const fetchProfileData = createAsyncThunk(
  "football/fetchProfileData",
  async (id: number, { dispatch, getState }) => {
    dispatch(setLoading(true));
    try {
      const state = getState() as RootState;
      const { teamInfoList, coachList, playersList } = state.football;

      const profile = await SportsInfoService.fetchProfile(id);

      const index = teamInfoList.findIndex((p) => p.team.id === id);

      // Fetch team info with matches
      const teamInfo = profile.teamInfo;

      const newTeamInfoList =
        index === -1
          ? [...teamInfoList, teamInfo]
          : [
              ...teamInfoList.slice(0, index),
              teamInfo,
              ...teamInfoList.slice(index + 1),
            ];

      const [nextMatches, lastMatches] = await Promise.all([
        MatchService.fetchUpcomingMatches(id),
        MatchService.fetchLastMatches(id),
      ]);

      teamInfo.nextMatches = nextMatches.slice();
      teamInfo.lastMatches = lastMatches.slice();

      // Fetch and update coach
      const coach = profile.coach.player;
      const newCoachList =
        index === -1
          ? [...coachList, { team: { id }, player: coach }]
          : [
              ...coachList.slice(0, index),
              { team: { id }, player: coach },
              ...coachList.slice(index + 1),
            ];

      let newPlayersList;

      if (index === -1) {
        newPlayersList = [
          ...playersList,
          {
            player: profile.players.player,
            team: {
              id,
            },
          },
        ];
      } else {
        newPlayersList = [
          ...playersList.slice(0, index),
          {
            player: profile.players.player,
            team: {
              id,
            },
          },
          ...playersList.slice(index + 1),
        ];
      }
      dispatch(setPlayersList(newPlayersList));

      AsyncStorage.setItem("players", JSON.stringify(newPlayersList));

      // Save to AsyncStorage
      dispatch(setTeamInfoList(newTeamInfoList));
      dispatch(setCoachList(newCoachList));

      await Promise.all([
        AsyncStorage.setItem("teams", JSON.stringify(newTeamInfoList)),
        AsyncStorage.setItem("coaches", JSON.stringify(newCoachList)),
      ]);
      dispatch(setLoading(false));
    } catch (error: any) {
      console.log("error", error.message);
      dispatch(setLoading(false));
      //console.error("[Redux Football] Failed to fetch profile data:", error);
      throw error;
    }
  }
);

// Initialize app data
export const initializeAppData = createAsyncThunk(
  "football/initializeAppData",
  async (_, { dispatch }) => {
    await dispatch(loadAppData());
    await dispatch(fetchProfileData(RealMadridId));
  }
);

// Clear all football data
export const clearFootballData = createAsyncThunk(
  "football/clearFootballData",
  async (_, { dispatch }) => {
    await AsyncStorage.multiRemove(["players", "coaches", "teams"]);
    dispatch(setPlayersList([]));
    dispatch(setCoachList([]));
    dispatch(setTeamInfoList([]));
  }
);
