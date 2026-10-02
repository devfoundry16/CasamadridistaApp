// store/thunks/environmentThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchAppInfo } from "@/services/AppInfoService";
import {
  setEnvironment,
  setLoading,
  setError,
  setMaintenance,
} from "../slices/environmentSlice";
import {
  NO_MAINTENANCE,
  maintenanceAfterFailure,
} from "@/utils/maintenance.core";
import { RootState } from "../store";

// Fetch environment variables from backend
export const fetchEnvironment = createAsyncThunk(
  "environment/fetchEnvironment",
  async (_, { dispatch, getState }) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const response = await fetchAppInfo(true); // force refresh
      // The backend answered, so it is not (or no longer) in maintenance.
      dispatch(setMaintenance(NO_MAINTENANCE));
      if (response.success && response.data) {
        dispatch(
          setEnvironment({
            auth: {
              username: response.data.auth?.username || "",
              password: response.data.auth?.password || "",
            },
            woocommerce: {
              username: response.data.woocommerce?.username || "",
              password: response.data.woocommerce?.password || "",
            },
            payment: response.data.payment,
            apiSports: {
              apiKey: response.data.apiSports?.apiKey || "",
            },
            football: {
              currentSeason: Number(response.data.football?.currentSeason ?? 2025),
            },
            revenueCat: {
              iosApiKey: response.data.revenueCat?.iosApiKey || "",
              androidApiKey: response.data.revenueCat?.androidApiKey || "",
            },
          }),
        );
        return response.data;
      } else {
        throw new Error("Failed to fetch environment data");
      }
    } catch (error: any) {
      const { maintenance } = (getState() as RootState).environment;
      dispatch(setMaintenance(maintenanceAfterFailure(maintenance, error)));
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  },
);

/**
 * Re-check for maintenance when the app comes back to the foreground.
 *
 * Deliberately not `fetchEnvironment`: that replaces every config object in
 * the store, and screens with effects keyed on those objects would re-run
 * each time the app is reopened. This only touches the maintenance state,
 * except when leaving maintenance, where the config was never loaded.
 */
export const checkMaintenance = createAsyncThunk(
  "environment/checkMaintenance",
  async (_, { dispatch, getState }) => {
    const { maintenance } = (getState() as RootState).environment;
    if (maintenance.active) {
      await dispatch(fetchEnvironment());
      return;
    }
    try {
      await fetchAppInfo(true);
    } catch (error) {
      const next = maintenanceAfterFailure(maintenance, error);
      if (next.active) dispatch(setMaintenance(next));
    }
  },
);
