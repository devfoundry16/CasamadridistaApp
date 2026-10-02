// store/slices/environmentSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CURRENT_FOOTBALL_SEASON } from "@/constants/football";
import { MaintenanceState, NO_MAINTENANCE } from "@/utils/maintenance.core";

interface EnvironmentState {
  auth: {
    username: string;
    password: string;
  };
  woocommerce: {
    username: string;
    password: string;
  };
  payment: {
    stripe: {
      publishableKey: string;
    };
    paypal: {
      clientId: string;
      clientSecret: string;
      mode: "sandbox" | "live";
    };
  };
  apiSports: {
    apiKey: string;
  };
  football: {
    currentSeason: number;
  };
  revenueCat: {
    iosApiKey: string;
    androidApiKey: string;
  };
  isLoading: boolean;
  error: string | null;
  // Set while the backend is refusing requests for maintenance. The root
  // layout shows the maintenance screen instead of the app while it is active.
  maintenance: MaintenanceState;
}

const initialState: EnvironmentState = {
  auth: {
    username: "",
    password: "",
  },
  woocommerce: {
    username: "",
    password: "",
  },
  payment: {
    stripe: {
      publishableKey: "",
    },
    paypal: {
      clientId: "",
      clientSecret: "",
      mode: "sandbox",
    },
  },
  apiSports: {
    apiKey: "",
  },
  football: {
    currentSeason: CURRENT_FOOTBALL_SEASON,
  },
  revenueCat: {
    iosApiKey: "",
    androidApiKey: "",
  },
  isLoading: false,
  error: null,
  maintenance: NO_MAINTENANCE,
};

const environmentSlice = createSlice({
  name: "environment",
  initialState,
  reducers: {
    setEnvironment: (
      state,
      action: PayloadAction<Partial<EnvironmentState>>
    ) => {
      Object.assign(state, action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setMaintenance: (state, action: PayloadAction<MaintenanceState>) => {
      state.maintenance = action.payload;
    },
  },
});

export const { setEnvironment, setLoading, setError, setMaintenance } =
  environmentSlice.actions;

export default environmentSlice.reducer;
