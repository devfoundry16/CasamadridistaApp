// store/slices/footballSlice.ts
import {
  CoachWithTeam,
  PlayerWithTeam,
  TeamInfo,
} from "@/types/soccer/profile";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface FootballState {
  playersList: PlayerWithTeam[];
  coachList: CoachWithTeam[];
  teamInfoList: TeamInfo[];
  isLoading: boolean;
}

const initialState: FootballState = {
  playersList: [],
  coachList: [],
  teamInfoList: [],
  isLoading: false,
};

const footballSlice = createSlice({
  name: "football",
  initialState,
  reducers: {
    setPlayersList: (state, action: PayloadAction<PlayerWithTeam[]>) => {
      state.playersList = action.payload.slice();
    },
    setCoachList: (state, action: PayloadAction<CoachWithTeam[]>) => {
      state.coachList = action.payload.slice();
    },
    setTeamInfoList: (state, action: PayloadAction<TeamInfo[]>) => {
      state.teamInfoList = action.payload.slice();
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearFootballData: (state) => {
      state.playersList = [];
      state.coachList = [];
      state.teamInfoList = [];
    },
  },
});

export const {
  setPlayersList,
  setCoachList,
  setTeamInfoList,
  setLoading,
  clearFootballData,
} = footballSlice.actions;

export default footballSlice.reducer;
