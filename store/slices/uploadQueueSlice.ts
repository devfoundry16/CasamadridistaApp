import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
  readiness,
  type QueueReadiness,
  type UploadEntry,
} from '@/services/upload/uploadPolicy.core';

/**
 * The upload queue's view model.
 *
 * Redux, not React Query, because this is *client* state that outlives every
 * screen: a Quick Post's six files keep uploading while the contributor walks
 * back to the hub, opens the match page and locks their phone. `UploadManager`
 * is the only writer; components read through the selectors below.
 *
 * Durability lives in `UploadManager` (AsyncStorage, via
 * `serializeQueue`/`deserializeQueue`), not here — a redux-persist round trip
 * on every progress tick would be a write per 100 kB uploaded.
 */
export interface UploadQueueState {
  entries: Record<string, UploadEntry>;
  /** Insertion order, so the uploads screen is stable while entries mutate. */
  order: string[];
  hydrated: boolean;
}

const initialState: UploadQueueState = {
  entries: {},
  order: [],
  hydrated: false,
};

function insert(state: UploadQueueState, entry: UploadEntry) {
  if (!state.entries[entry.id]) state.order.push(entry.id);
  state.entries[entry.id] = entry;
}

const uploadQueueSlice = createSlice({
  name: 'uploadQueue',
  initialState,
  reducers: {
    /** Replaces the queue wholesale from persisted storage on app start. */
    queueHydrated(state, action: PayloadAction<UploadEntry[]>) {
      state.entries = {};
      state.order = [];
      for (const entry of action.payload) insert(state, entry);
      state.hydrated = true;
    },
    entryUpserted(state, action: PayloadAction<UploadEntry>) {
      insert(state, action.payload);
    },
    entriesUpserted(state, action: PayloadAction<UploadEntry[]>) {
      for (const entry of action.payload) insert(state, entry);
    },
    /**
     * Progress-only update. Separate from `entryUpserted` because
     * `UploadManager` throttles these and never persists them.
     */
    entryProgressed(state, action: PayloadAction<{ id: string; progress: number }>) {
      const entry = state.entries[action.payload.id];
      if (entry) entry.progress = action.payload.progress;
    },
    entryRemoved(state, action: PayloadAction<string>) {
      delete state.entries[action.payload];
      state.order = state.order.filter((id) => id !== action.payload);
    },
    itemCleared(state, action: PayloadAction<string>) {
      for (const id of [...state.order]) {
        if (state.entries[id]?.itemId === action.payload) {
          delete state.entries[id];
          state.order = state.order.filter((other) => other !== id);
        }
      }
    },
    queueCleared() {
      return { ...initialState, hydrated: true };
    },
  },
});

export const {
  queueHydrated,
  entryUpserted,
  entriesUpserted,
  entryProgressed,
  entryRemoved,
  itemCleared,
  queueCleared,
} = uploadQueueSlice.actions;

export default uploadQueueSlice.reducer;

/* ------------------------------------------------------------------ */
/* Selectors                                                           */
/* ------------------------------------------------------------------ */

interface WithUploadQueue {
  uploadQueue: UploadQueueState;
}

const selectState = (state: WithUploadQueue) => state.uploadQueue;

/**
 * Memoised: this maps over `order` on every store change, and an unmemoised
 * version would hand every subscribed component a new array each tick and
 * re-render the whole uploads screen on one progress byte.
 */
export const selectUploadEntries = createSelector([selectState], (queue): UploadEntry[] =>
  queue.order.map((id) => queue.entries[id]).filter(Boolean),
);

export const selectUploadQueueHydrated = (state: WithUploadQueue) => state.uploadQueue.hydrated;

/**
 * How many uploads are still in flight, for the badge on the uploads screen.
 *
 * `uploaded` counts: the bytes are on the server but the item is not finished —
 * it is waiting to be completed/transcoded, and `runnableEntries` treats it as
 * a waiting state alongside `queued`. Omitting it made the badge read zero
 * while work was still outstanding.
 */
export const selectActiveUploadCount = createSelector(
  [selectUploadEntries],
  (entries) =>
    entries.filter(
      (entry) =>
        entry.status === 'queued' ||
        entry.status === 'preparing' ||
        entry.status === 'uploading' ||
        entry.status === 'uploaded' ||
        entry.status === 'completing' ||
        entry.status === 'processing',
    ).length,
);

export const selectFailedUploadCount = createSelector(
  [selectUploadEntries],
  (entries) => entries.filter((entry) => entry.status === 'failed').length,
);

/**
 * Per-item selectors are factories so each screen memoises against its own id;
 * a shared selector would thrash its cache between two mounted item screens.
 */
export const makeSelectItemUploads = () =>
  createSelector(
    [selectUploadEntries, (_state: WithUploadQueue, itemId: string | undefined) => itemId],
    (entries, itemId): UploadEntry[] =>
      itemId ? entries.filter((entry) => entry.itemId === itemId) : [],
  );

export const makeSelectItemReadiness = () => {
  const selectItemUploads = makeSelectItemUploads();
  return createSelector([selectItemUploads], (entries): QueueReadiness => readiness(entries));
};
