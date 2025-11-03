// hooks/useFootball.ts
import MatchService from "@/services/Football/MatchService";
import { AppDispatch, RootState } from "@/store/store";
import {
  clearFootballData,
  fetchProfileData,
  initializeAppData,
  loadAppData,
} from "@/store/thunks/footballThunks";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

export const useFootball = () => {
  const dispatch = useDispatch<AppDispatch>();

  const footballState = useSelector((state: RootState) => state.football);
  const { playersList, coachList, teamInfoList, isLoading } = footballState;

  const loadFootballData = useCallback(() => {
    return dispatch(loadAppData());
  }, [dispatch]);

  const fetchTeamProfileData = useCallback(
    (id: number) => {
      return dispatch(fetchProfileData(id));
    },
    [dispatch]
  );

  const fetchLiveMatch = useCallback((id: number) => {
    return MatchService.fetchLiveMatch(id);
  }, []);

  const initializeFootballData = useCallback(() => {
    return dispatch(initializeAppData());
  }, [dispatch]);

  const clearAllFootballData = useCallback(() => {
    return dispatch(clearFootballData());
  }, [dispatch]);

  return {
    // State
    playersList,
    coachList,
    teamInfoList,
    isLoading,

    // Actions
    loadAppData: loadFootballData,
    fetchProfileData: fetchTeamProfileData,
    fetchLiveMatchData: fetchLiveMatch,
    initializeAppData: initializeFootballData,
    clearFootballData: clearAllFootballData,
  };
};
