// store/thunks/environmentThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchAppInfo } from "@/services/AppInfoService";
import {
  setEnvironment,
  setLoading,
  setError,
} from "../slices/environmentSlice";

// Fetch environment variables from backend
export const fetchEnvironment = createAsyncThunk(
  "environment/fetchEnvironment",
  async (_, { dispatch }) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const response = await fetchAppInfo(true); // force refresh
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
          })
        );
        return response.data;
      } else {
        throw new Error("Failed to fetch environment data");
      }
    } catch (error: any) {
      dispatch(setError(error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);
