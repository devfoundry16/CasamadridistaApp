/**
 * uploadPolicy.core.ts
 *
 * Every decision the upload manager makes that does not need a device.
 *
 * Deliberately zero imports: no react-native, no expo, no AsyncStorage, no
 * axios. That is what lets `utils/__tests__/uploadPolicy.test.mts` execute these
 * rules under `node --test` (this repo has no RN test runner), and it is why the
 * four things that are genuinely easy to get wrong live here rather than inside
 * `UploadManager`:
 *
 *   1. the retry / backoff schedule,
 *   2. "is this upload slot still usable, and if not do I `create` or `retry`",
 *   3. what survives being written to AsyncStorage and read back after an app
 *      kill (a draft has to come back),
 *   4. whether an item is ready to be submitted with `publish_when_ready`.
 *
 * `UploadManager` owns only the I/O: pick files, ask for slots, push bytes,
 * dispatch to Redux.
 */

/* ------------------------------------------------------------------ */
/* Shape                                                               */
/* ------------------------------------------------------------------ */

export type UploadEntryStatus =
  /** waiting for a worker slot (also the state a backoff timer waits in) */
  | 'queued'
  /** copying/resizing the local file into documentDirectory */
  | 'preparing'
  /** bytes in flight */
  | 'uploading'
  /**
   * Bytes delivered, `POST …/complete` not yet acknowledged.
   *
   * This state exists because a Cloudflare Direct Creator Upload URL is
   * **single use**: once the bytes are on the wire, re-sending them is not just
   * wasteful, it is impossible against the same slot. An entry that reaches
   * here never goes back to `queued`; a failed completion retries only the
   * completion call.
   */
  | 'uploaded'
  /** the completion call is in flight */
  | 'completing'
  /** the server accepted it and is transcoding (Cloudflare) */
  | 'processing'
  | 'ready'
  | 'failed';

export type UploadProviderName = 'supabase' | 'cloudflare_stream';

export interface UploadEntry {
  /** Client-side queue id. Stable across retries; NOT the asset id. */
  id: string;
  itemId: string;
  /** Null until the first slot is granted. A retry reuses this id. */
  assetId: string | null;
  kind: 'image' | 'video';
  role: 'content' | 'cover';
  position: number;
  /** File inside documentDirectory/uploads — survives an app kill. */
  localUri: string;
  /**
   * Client-generated video poster, also inside documentDirectory/uploads.
   * Pushed to the slot's `thumbnailUploadUrl` when the provider offers one, so
   * a video has a still frame before the transcode finishes.
   */
  posterUri: string | null;
  mime: string;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  status: UploadEntryStatus;
  /** 0..1 */
  progress: number;
  /** Failed attempts so far. */
  attempts: number;
  error: string | null;
  provider: UploadProviderName | null;
  uploadUrl: string | null;
  method: 'PUT' | 'POST' | null;
  /** ISO timestamp from the slot response. */
  expiresAt: string | null;
  /** Epoch ms; a queued entry is not runnable before this. */
  nextAttemptAt: number | null;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/* Retry schedule                                                      */
/* ------------------------------------------------------------------ */

/** Plan §5.5: "retry 2/4/8 s ×3". */
export const RETRY_BACKOFF_MS: readonly number[] = [2000, 4000, 8000];

export const MAX_ATTEMPTS = RETRY_BACKOFF_MS.length;

/**
 * Delay before attempt number `attempts + 1`, or null when the ladder is spent.
 *
 * `attempts` is the count of attempts that have already *failed*, so a first
 * failure (attempts becomes 1) waits `RETRY_BACKOFF_MS[0]`.
 */
export function backoffDelayMs(attempts: number): number | null {
  if (!Number.isFinite(attempts) || attempts < 0) return RETRY_BACKOFF_MS[0];
  if (attempts >= MAX_ATTEMPTS) return null;
  return RETRY_BACKOFF_MS[attempts];
}

/**
 * Where an entry resumes from after a failure.
 *
 * The only question that matters is whether its bytes are already on the
 * server. If they are, it must come back as `uploaded` — never `queued` — or
 * the next attempt would re-send a 200 MB video to a single-use URL.
 */
export function resumeStatus(entry: UploadEntry): 'queued' | 'uploaded' {
  return hasDeliveredBytes(entry) ? 'uploaded' : 'queued';
}

/** True once the bytes are on the server, whatever happened afterwards. */
export function hasDeliveredBytes(entry: UploadEntry): boolean {
  return entry.status === 'uploaded' || entry.status === 'completing';
}

/**
 * Fold one failure into an entry.
 *
 * Returns a re-runnable entry with a backoff deadline while attempts remain,
 * and a terminal `failed` entry once they do not. Never mutates the input —
 * Redux (immer) freezes every object it has been handed.
 */
export function planFailure(entry: UploadEntry, now: number, message: string): UploadEntry {
  // The delay is read off the count *before* this failure, so the first one
  // waits 2 s. Three retries follow the initial try; the fourth failure is
  // terminal.
  const delay = backoffDelayMs(entry.attempts);
  const resume = resumeStatus(entry);
  return {
    ...entry,
    attempts: entry.attempts + 1,
    error: message,
    // A failed *completion* has not lost any bytes, so its progress bar stays
    // full; a failed upload restarts from zero.
    progress: resume === 'uploaded' ? 1 : 0,
    status: delay === null ? 'failed' : resume,
    nextAttemptAt: delay === null ? null : now + delay,
    updatedAt: now,
  };
}

/**
 * A manual retry starts the ladder again, immediately — but it still cannot
 * un-send bytes, so an entry that already delivered them resumes at `uploaded`.
 */
export function planManualRetry(entry: UploadEntry, now: number): UploadEntry {
  return {
    ...entry,
    status: resumeStatus(entry),
    attempts: 0,
    progress: hasDeliveredBytes(entry) ? 1 : 0,
    error: null,
    nextAttemptAt: null,
    updatedAt: now,
  };
}

/* ------------------------------------------------------------------ */
/* Slot expiry                                                         */
/* ------------------------------------------------------------------ */

/**
 * Treat a slot as dead a minute before the server does.
 *
 * A signed URL that expires *during* a 200 MB upload fails at the very end,
 * after all the bytes have been paid for on a stadium LTE connection. Better to
 * re-request a slot we did not strictly need to.
 */
export const SLOT_EXPIRY_SKEW_MS = 60_000;

export function isSlotExpired(
  expiresAt: string | null | undefined,
  now: number,
  skewMs: number = SLOT_EXPIRY_SKEW_MS,
): boolean {
  if (!expiresAt) return false; // no stated expiry ⇒ assume the slot is open
  const at = Date.parse(expiresAt);
  if (Number.isNaN(at)) return false; // unparseable ⇒ don't throw the slot away
  return at - skewMs <= now;
}

export type SlotAction = 'create' | 'retry' | 'reuse' | 'complete-only';

/**
 * What to do before pushing bytes.
 *
 *   'complete-only' — the bytes are already on the server; only
 *                     `POST …/complete` is outstanding. Checked FIRST, and it
 *                     is the whole reason `uploaded` exists: a Cloudflare
 *                     direct-upload URL is single use, so re-sending is not a
 *                     recoverable option, and a slot expiry here is irrelevant.
 *   'create'        — no asset row yet: `POST …/assets`.
 *   'retry'         — an asset row exists but its URL is missing or stale:
 *                     `POST …/assets/:assetId/retry`, which returns a fresh
 *                     slot for the SAME assetId. Creating a second slot here
 *                     would orphan the first asset row and inflate
 *                     `asset_count`.
 *   'reuse'         — the slot we already hold is still good.
 */
export function slotAction(entry: UploadEntry, now: number): SlotAction {
  if (hasDeliveredBytes(entry) && entry.assetId) return 'complete-only';
  if (!entry.assetId) return 'create';
  if (!entry.uploadUrl) return 'retry';
  if (isSlotExpired(entry.expiresAt, now)) return 'retry';
  return 'reuse';
}

/* ------------------------------------------------------------------ */
/* Scheduling                                                          */
/* ------------------------------------------------------------------ */

export const CONCURRENCY = 2;

const ACTIVE_STATUSES: readonly UploadEntryStatus[] = ['preparing', 'uploading', 'completing'];

export function isActive(entry: UploadEntry): boolean {
  return ACTIVE_STATUSES.includes(entry.status);
}

export function isTerminal(entry: UploadEntry): boolean {
  return entry.status === 'ready' || entry.status === 'failed';
}

/**
 * `uploaded` is runnable alongside `queued`: it is a *waiting* state (waiting
 * for its completion call), not an in-flight one.
 */
export function isRunnable(entry: UploadEntry, now: number): boolean {
  if (entry.status !== 'queued' && entry.status !== 'uploaded') return false;
  return entry.nextAttemptAt === null || entry.nextAttemptAt <= now;
}

/**
 * The entries a pump should start right now, oldest first.
 *
 * `runningIds` is the manager's own in-flight set; it is passed in rather than
 * derived from status so a task that has been started but whose status
 * dispatch has not landed yet cannot be started twice.
 */
export function selectRunnable(
  entries: UploadEntry[],
  now: number,
  runningIds: readonly string[] = [],
  concurrency: number = CONCURRENCY,
): UploadEntry[] {
  const running = new Set(runningIds);
  // Either half alone under-counts: a task started this tick is in `running`
  // before its status dispatch lands, and a rehydrated `uploading` row is
  // active without any task behind it.
  const busy = entries.filter((e) => running.has(e.id) || isActive(e)).length;
  const free = Math.max(0, concurrency - busy);
  if (free === 0) return [];

  return entries
    .filter((e) => !running.has(e.id) && isRunnable(e, now))
    .sort((a, b) => a.createdAt - b.createdAt || a.position - b.position)
    .slice(0, free);
}

/**
 * When the pump should wake up again, or null if nothing is waiting.
 * Used to arm a single timer instead of polling.
 */
export function nextWakeUpAt(entries: UploadEntry[], now: number): number | null {
  const pending = entries
    .filter(
      (e) =>
        (e.status === 'queued' || e.status === 'uploaded') &&
        e.nextAttemptAt !== null &&
        e.nextAttemptAt > now,
    )
    .map((e) => e.nextAttemptAt as number);
  return pending.length ? Math.min(...pending) : null;
}

export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

export const UPLOAD_QUEUE_STORAGE_KEY = 'casa_media_upload_queue';

/** Entries older than this are dropped on rehydrate rather than retried forever. */
export const QUEUE_ENTRY_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * What an entry looks like after a cold start.
 *
 * `ready`, `processing`, `uploaded` and `failed` are kept as they are — the
 * server holds that state, not us. Only the three in-flight statuses are
 * rewritten, and *where* they land is the important part:
 *
 *   preparing  → queued    (the copy never finished; start over)
 *   uploading  → queued    (bytes were partial; they have to be re-sent, and
 *                           `slotAction` will mint a fresh slot for the same
 *                           asset id because the URL is dropped below)
 *   completing → uploaded  (the bytes ARE on the server; demoting this to
 *                           `queued` would re-upload the whole file to satisfy
 *                           a completion call that is all that is missing)
 *
 * The upload URL is dropped for the first two on purpose: it may well have
 * expired while the app was dead.
 */
export function rehydrateEntry(entry: UploadEntry): UploadEntry {
  if (entry.status === 'completing') {
    return { ...entry, status: 'uploaded', progress: 1, nextAttemptAt: null };
  }
  if (entry.status !== 'preparing' && entry.status !== 'uploading') return entry;
  return {
    ...entry,
    status: 'queued',
    progress: 0,
    uploadUrl: null,
    nextAttemptAt: null,
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

const STATUSES: readonly UploadEntryStatus[] = [
  'queued',
  'preparing',
  'uploading',
  'uploaded',
  'completing',
  'processing',
  'ready',
  'failed',
];

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Validate one persisted record. Returns null for anything we cannot run —
 * a half-written entry must not wedge the whole queue on rehydrate.
 */
export function parseEntry(raw: unknown): UploadEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  if (!isNonEmptyString(r.id) || !isNonEmptyString(r.itemId) || !isNonEmptyString(r.localUri)) {
    return null;
  }
  if (r.kind !== 'image' && r.kind !== 'video') return null;

  const status = STATUSES.includes(r.status as UploadEntryStatus)
    ? (r.status as UploadEntryStatus)
    : 'queued';

  return {
    id: r.id,
    itemId: r.itemId,
    assetId: isNonEmptyString(r.assetId) ? r.assetId : null,
    kind: r.kind,
    role: r.role === 'cover' ? 'cover' : 'content',
    position: typeof r.position === 'number' && Number.isFinite(r.position) ? r.position : 0,
    localUri: r.localUri,
    posterUri: isNonEmptyString(r.posterUri) ? r.posterUri : null,
    mime: isNonEmptyString(r.mime) ? r.mime : 'application/octet-stream',
    sizeBytes: numberOrNull(r.sizeBytes),
    width: numberOrNull(r.width),
    height: numberOrNull(r.height),
    durationMs: numberOrNull(r.durationMs),
    status,
    progress: clampProgress(typeof r.progress === 'number' ? r.progress : 0),
    attempts: typeof r.attempts === 'number' && r.attempts >= 0 ? Math.floor(r.attempts) : 0,
    error: isNonEmptyString(r.error) ? r.error : null,
    provider:
      r.provider === 'supabase' || r.provider === 'cloudflare_stream' ? r.provider : null,
    uploadUrl: isNonEmptyString(r.uploadUrl) ? r.uploadUrl : null,
    method: r.method === 'PUT' || r.method === 'POST' ? r.method : null,
    expiresAt: isNonEmptyString(r.expiresAt) ? r.expiresAt : null,
    nextAttemptAt: numberOrNull(r.nextAttemptAt),
    createdAt: numberOrNull(r.createdAt) ?? 0,
    updatedAt: numberOrNull(r.updatedAt) ?? 0,
  };
}

/**
 * `ready` entries are not persisted: the asset row on the server is the record,
 * and keeping them would grow the blob without bound.
 */
export function serializeQueue(entries: UploadEntry[]): string {
  return JSON.stringify(entries.filter((e) => e.status !== 'ready'));
}

export function deserializeQueue(
  raw: string | null | undefined,
  now: number = Date.now(),
  ttlMs: number = QUEUE_ENTRY_TTL_MS,
): UploadEntry[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map(parseEntry)
    .filter((e): e is UploadEntry => e !== null)
    .filter((e) => e.createdAt === 0 || now - e.createdAt <= ttlMs)
    .map(rehydrateEntry);
}

/* ------------------------------------------------------------------ */
/* Readiness                                                           */
/* ------------------------------------------------------------------ */

export interface QueueReadiness {
  total: number;
  ready: number;
  failed: number;
  /** queued | preparing | uploading | completing */
  pending: number;
  processing: number;
  /** 0..1 across every entry, so one big video does not read as "done". */
  progress: number;
  /** Every entry finished successfully. Safe to publish immediately. */
  allReady: boolean;
  /**
   * Safe to submit with `publish_when_ready`: there is something to publish,
   * nothing has hard-failed, and every entry already owns a server-side asset
   * row — the worker publishes off those rows, so an entry that has never been
   * granted a slot would simply be left behind.
   */
  canPublishWhenReady: boolean;
}

export function readiness(entries: UploadEntry[]): QueueReadiness {
  const total = entries.length;
  let ready = 0;
  let failed = 0;
  let processing = 0;
  let pending = 0;
  let progressSum = 0;
  let allHaveAssets = true;

  for (const entry of entries) {
    if (!entry.assetId) allHaveAssets = false;
    switch (entry.status) {
      case 'ready':
        ready += 1;
        progressSum += 1;
        break;
      case 'failed':
        failed += 1;
        break;
      case 'processing':
        processing += 1;
        progressSum += 1;
        break;
      case 'uploaded':
      case 'completing':
        // The bytes are delivered; only bookkeeping is outstanding.
        pending += 1;
        progressSum += 1;
        break;
      default:
        pending += 1;
        progressSum += clampProgress(entry.progress);
    }
  }

  return {
    total,
    ready,
    failed,
    pending,
    processing,
    progress: total ? progressSum / total : 0,
    allReady: total > 0 && ready === total,
    canPublishWhenReady: total > 0 && failed === 0 && allHaveAssets,
  };
}

export function entriesForItem(entries: UploadEntry[], itemId: string): UploadEntry[] {
  return entries.filter((e) => e.itemId === itemId);
}

export function itemReadiness(entries: UploadEntry[], itemId: string): QueueReadiness {
  return readiness(entriesForItem(entries, itemId));
}
