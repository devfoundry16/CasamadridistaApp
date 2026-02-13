// store/store.ts (updated)
import { configureStore } from "@reduxjs/toolkit";
import footballReducer from "./slices/footballSlice";
import userReducer from "./slices/userSlice";
import environmentReducer from "./slices/environmentSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    football: footballReducer,
    environment: environmentReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
