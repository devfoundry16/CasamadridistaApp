// store/store.ts (updated)
import { configureStore } from "@reduxjs/toolkit";
import footballReducer from "./slices/footballSlice";
import userReducer from "./slices/userSlice";
import environmentReducer from "./slices/environmentSlice";
import uploadQueueReducer from "./slices/uploadQueueSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    football: footballReducer,
    environment: environmentReducer,
    // Contributor uploads: client state that outlives every screen, written
    // only by services/upload/UploadManager.
    uploadQueue: uploadQueueReducer,
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
