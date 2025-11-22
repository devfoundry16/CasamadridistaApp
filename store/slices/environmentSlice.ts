// store/slices/environmentSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

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
  isLoading: boolean;
  error: string | null;
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
  isLoading: false,
  error: null,
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
  },
});

export const { setEnvironment, setLoading, setError } =
  environmentSlice.actions;

export default environmentSlice.reducer;
