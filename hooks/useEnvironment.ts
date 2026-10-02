import { useDispatch, useSelector } from "react-redux";
import {
  checkMaintenance,
  fetchEnvironment,
} from "@/store/thunks/environmentThunks";
import { AppDispatch, RootState } from "@/store/store";
import { useCallback } from "react";

export const useEnvironment = () => {
  const dispatch = useDispatch<AppDispatch>();
  const environment = useSelector((state: RootState) => state.environment);
  const loadEnvironment = useCallback(() => {
    return dispatch(fetchEnvironment());
  }, [dispatch]);
  const recheckMaintenance = useCallback(() => {
    return dispatch(checkMaintenance());
  }, [dispatch]);
  return {
    auth: environment.auth,
    woocommerce: environment.woocommerce,
    payment: environment.payment,
    apiSports: environment.apiSports,
    football: environment.football,
    revenueCat: environment.revenueCat,
    isLoading: environment.isLoading,
    error: environment.error,
    maintenance: environment.maintenance,
    loadEnvironment,
    recheckMaintenance,
  } as const;
};
