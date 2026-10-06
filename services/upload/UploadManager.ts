import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { AppState, TurboModuleRegistry, type AppStateStatus } from 'react-native';

import ContributorMediaService from '@/services/ContributorMediaService';
import { store } from '@/store/store';
import {
  entriesUpserted,
  entryProgressed,
  entryRemoved,
  entryUpserted,
  itemCleared,
  queueHydrated,
} from '@/store/slices/uploadQueueSlice';
import type { ContributorAsset, UploadSlot } from '@/types/media/contributor';
import { retryWhileIncomplete } from '@/utils/uploadTarget.core';
import {
  UPLOAD_QUEUE_STORAGE_KEY,
  clampProgress,
  deserializeQueue,
  nextWakeUpAt,
  planFailure,
  planManualRetry,
  readiness,
  selectRunnable,
  serializeQueue,
  slotAction,
  type QueueReadiness,
  type SlotAction,
  type UploadEntry,
} from './uploadPolicy.core';
import {
  TUS_HEADERS,
  headSaysGone,
  isUploadGone,
  needsResumableSlot,
  nextChunk,
  readOffset,
  shouldUseTus,
  tusProgress,
} from '@/utils/tusUpload.core';
import {
  compressionPlan,
  scaledDimensions,
  type CompressionPlan,
} from '@/utils/videoCompression.core';

export type { UploadEntry, UploadEntryStatus } from './uploadPolicy.core';

/** Plan §5.5: photos are resized to a 3000 px long edge, JPEG q0.9. */
const MAX_IMAGE_EDGE = 3000;
const IMAGE_QUALITY = 0.9;

const UPLOAD_DIR = `${FileSystem.documentDirectory ?? ''}uploads/`;

/** Redux gets a progress tick at most this often, per entry. */
const PROGRESS_THROTTLE_MS = 250;
const PROGRESS_EPSILON = 0.01;

/** How long to keep polling a transcoding asset before giving up on it. */
const PROCESSING_POLL_MS = 3000;
const PROCESSING_TIMEOUT_MS = 15 * 60_000;

export interface EnqueueInput {
  itemId: string;
  kind: 'image' | 'video';
  localUri: string;
  mime?: string | null;
  role?: 'content' | 'cover';
  position?: number;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
  sizeBytes?: number | null;
}

let counter = 0;
function nextId(): string {
  counter += 1;
  return `up_${Date.now().toString(36)}_${counter.toString(36)}`;
}

function extensionFor(kind: 'image' | 'video', mime: string): string {
  if (kind === 'image') return 'jpg';
  if (mime.includes('quicktime')) return 'mov';
  return 'mp4';
}

/**
 * The upload queue.
 *
 * Everything that needs a device lives here; every rule lives in
 * `uploadPolicy.core.ts`. The split matters because the rules (backoff, slot
 * expiry, what survives a kill) are the part that is wrong in subtle ways and
 * the part no simulator would show you.
 *
 * Lifecycle of one entry:
 *
 *   enqueue → preparing (resize + copy into documentDirectory)
 *           → queued
 *           → uploading   (POST …/assets or …/retry for a slot, then bytes)
 *           → completing  (POST …/complete)
 *           → processing  (Cloudflare transcode; polled)  → ready
 *
 * Two invariants are load-bearing:
 *
 *   1. **Bytes are read from documentDirectory, never from the picker URI.**
 *      An `ph://`/cache URI is gone after an app kill, and the whole point of
 *      the queue is that a draft survives one.
 *   2. **A recovery goes through `…/assets/:assetId/retry`, never
 *      `POST …/assets`.** The retry endpoint hands back a fresh slot for the
 *      same asset row; asking for a brand-new slot would leave the old row
 *      behind and inflate the item's `asset_count`.
 */
class UploadManagerClass {
  private entries = new Map<string, UploadEntry>();
  private running = new Set<string>();
  private tasks = new Map<string, FileSystem.UploadTask>();
  private lastProgressAt = new Map<string, number>();
  private pollTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private wakeTimer: ReturnType<typeof setTimeout> | null = null;
  private appStateSub: { remove: () => void } | null = null;
  private started = false;
  private persistQueued = false;

  /* ------------------------------ lifecycle ----------------------- */

  /** Idempotent. Called once from the root layout. */
  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;

    this.appStateSub = AppState.addEventListener('change', this.onAppStateChange);

    try {
      const raw = await AsyncStorage.getItem(UPLOAD_QUEUE_STORAGE_KEY);
      const restored = deserializeQueue(raw, Date.now());
      this.entries = new Map(restored.map((entry) => [entry.id, entry]));
      store.dispatch(queueHydrated(restored.map((entry) => ({ ...entry }))));
    } catch {
      store.dispatch(queueHydrated([]));
    }

    this.pump();
  }

  stop(): void {
    this.appStateSub?.remove();
    this.appStateSub = null;
    if (this.wakeTimer) clearTimeout(this.wakeTimer);
    this.wakeTimer = null;
    for (const timer of this.pollTimers.values()) clearTimeout(timer);
    this.pollTimers.clear();
    this.started = false;
  }

  private onAppStateChange = (state: AppStateStatus) => {
    // A backgrounded one-shot upload keeps running in its BACKGROUND session
    // (a chunked one only finishes the chunk in flight), but a connection that
    // died while we were away leaves entries parked in `queued`. Coming back to
    // the foreground is the natural moment to retry.
    if (state === 'active') this.pump();
  };

  /* ------------------------------ enqueue ------------------------- */

  /**
   * Add files to the queue for one item. Resolves once every file is durable
   * on disk (not once it has uploaded) — the caller can navigate away
   * immediately after.
   *
   * `autoStart: false` prepares the files but does not start the pump. Quick
   * Post needs that: it reserves an asset row for every entry before it
   * submits, and a pump already running `ensureSlot` on entry 1 would race
   * `reserveSlots` into creating a second slot for the same file. Call
   * `resume()` (or `reserveSlots`, which ends with a pump) to start.
   */
  async enqueue(inputs: EnqueueInput[], options: { autoStart?: boolean } = {}): Promise<string[]> {
    const now = Date.now();
    const created: UploadEntry[] = inputs.map((input, index) => ({
      id: nextId(),
      itemId: input.itemId,
      assetId: null,
      kind: input.kind,
      role: input.role ?? 'content',
      position: input.position ?? index,
      localUri: input.localUri,
      posterUri: null,
      mime: input.mime || (input.kind === 'image' ? 'image/jpeg' : 'video/mp4'),
      sizeBytes: input.sizeBytes ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      durationMs: input.durationMs ?? null,
      status: 'preparing',
      progress: 0,
      attempts: 0,
      error: null,
      provider: null,
      transport: null,
      uploadUrl: null,
      method: null,
      expiresAt: null,
      nextAttemptAt: null,
      createdAt: now + index, // keeps the picker's order stable in the queue
      updatedAt: now,
    }));

    for (const entry of created) this.entries.set(entry.id, entry);
    store.dispatch(entriesUpserted(created.map((entry) => ({ ...entry }))));
    await this.persist();

    // Photos are prepared together; videos one at a time, because preparing a
    // big clip can mean re-encoding it and two encoders at once fight for the
    // phone's single hardware encoder.
    await Promise.all(
      created.filter((entry) => entry.kind === 'image').map((entry) => this.prepare(entry.id)),
    );
    for (const entry of created.filter((e) => e.kind === 'video')) await this.prepare(entry.id);
    if (options.autoStart !== false) this.pump();
    return created.map((entry) => entry.id);
  }

  /**
   * Copy (and, for photos, downscale) the picked file into
   * `documentDirectory/uploads` so it outlives both the picker's cache and the
   * process itself.
   */
  private async prepare(entryId: string): Promise<void> {
    const entry = this.entries.get(entryId);
    if (!entry) return;

    // The encoder's output, in the cache. Removed whatever happens below.
    let compressedUri: string | null = null;

    try {
      await FileSystem.makeDirectoryAsync(UPLOAD_DIR, { intermediates: true });

      let sourceUri = entry.localUri;
      let width = entry.width;
      let height = entry.height;
      let mime = entry.mime;

      if (entry.kind === 'image') {
        const longEdge = Math.max(width ?? 0, height ?? 0);
        const actions: ImageManipulator.Action[] =
          longEdge > MAX_IMAGE_EDGE
            ? [
                {
                  resize:
                    (width ?? 0) >= (height ?? 0)
                      ? { width: MAX_IMAGE_EDGE }
                      : { height: MAX_IMAGE_EDGE },
                },
              ]
            : [];
        const result = await ImageManipulator.manipulateAsync(sourceUri, actions, {
          compress: IMAGE_QUALITY,
          format: ImageManipulator.SaveFormat.JPEG,
        });
        sourceUri = result.uri;
        width = result.width;
        height = result.height;
        mime = 'image/jpeg';
      }

      // A big, high-bitrate clip is re-encoded on the phone first: the upload
      // is the slow part at a stadium. Any failure uploads the original.
      if (entry.kind === 'video') {
        const plan = compressionPlan({
          sizeBytes: entry.sizeBytes,
          durationMs: entry.durationMs,
          width,
          height,
        });
        compressedUri = plan ? await this.compressVideo(entryId, sourceUri, plan) : null;
        if (compressedUri && plan) {
          sourceUri = compressedUri;
          mime = 'video/mp4';
          ({ width, height } = scaledDimensions(width, height, plan.maxSize));
        }
      }

      const target = `${UPLOAD_DIR}${entry.id}.${extensionFor(entry.kind, mime)}`;
      // A re-prepare (rare, but possible after a crash mid-copy) must not hit
      // "file exists".
      await FileSystem.deleteAsync(target, { idempotent: true });
      await FileSystem.copyAsync({ from: sourceUri, to: target });

      // Cancelled while the file was being prepared (an encode can take a
      // while): `update` below would be a no-op, and the copy would be left in
      // the documents directory with nothing pointing at it.
      if (!this.entries.has(entryId)) {
        await FileSystem.deleteAsync(target, { idempotent: true }).catch(() => {});
        return;
      }

      const info = await FileSystem.getInfoAsync(target);
      const sizeBytes = info.exists && typeof info.size === 'number' ? info.size : entry.sizeBytes;

      const posterUri =
        entry.kind === 'video' ? await this.makePoster(entry.id, target) : entry.posterUri;

      this.update(entryId, {
        localUri: target,
        posterUri,
        mime,
        width,
        height,
        sizeBytes: sizeBytes ?? null,
        status: 'queued',
        // The encoder reported its own progress into this bar; the upload
        // starts it again from nothing.
        progress: 0,
        error: null,
      });
    } catch (error: any) {
      this.update(entryId, {
        status: 'failed',
        // Not retryable: nothing about waiting 2 s makes an unreadable file
        // readable, and a phantom retry loop hides the real cause.
        attempts: Number.MAX_SAFE_INTEGER,
        error: error?.message || 'Could not read the selected file',
      });
    } finally {
      if (compressedUri) {
        await FileSystem.deleteAsync(compressedUri, { idempotent: true }).catch(() => {});
      }
    }
  }

  /**
   * Re-encode a video to the plan, returning the new file's URI, or null when
   * it could not be done — the encoder is a native module, so a build made
   * before it was added has none, and a codec it cannot read fails too. Null
   * means "upload the original", never "fail the upload".
   *
   * The native side is probed BEFORE the library is imported. Both libraries
   * throw while their module is being evaluated when the native half is
   * missing, and Metro reports a throw at that point as a fatal error before
   * any `catch` here could see it.
   */
  private async compressVideo(
    entryId: string,
    uri: string,
    plan: CompressionPlan,
  ): Promise<string | null> {
    if (TurboModuleRegistry.get('NitroModules') == null) return null;
    try {
      const { NitroModules } = await import('react-native-nitro-modules');
      if (!NitroModules.hasHybridObject('Compressor')) return null;

      const { Video } = await import('react-native-compressor');
      const output = await Video.compress(
        uri,
        { compressionMethod: 'manual', maxSize: plan.maxSize, bitrate: plan.bitrate },
        (progress) => this.reportProgress(entryId, progress),
      );
      const info = await FileSystem.getInfoAsync(output);
      return info.exists ? output : null;
    } catch {
      return null;
    }
  }

  /**
   * A still frame from the video, kept next to the video itself.
   *
   * Best-effort: a codec the extractor cannot open is not a reason to fail an
   * upload, and Cloudflare will generate its own thumbnail during the
   * transcode. This one just gets there first.
   */
  private async makePoster(entryId: string, videoUri: string): Promise<string | null> {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, { time: 500 });
      const target = `${UPLOAD_DIR}${entryId}-poster.jpg`;
      await FileSystem.deleteAsync(target, { idempotent: true });
      await FileSystem.copyAsync({ from: uri, to: target });
      return target;
    } catch {
      return null;
    }
  }

  /** Push the poster to the slot's thumbnail URL. Never fails the upload. */
  private async pushThumbnail(posterUri: string, uploadUrl: string): Promise<void> {
    try {
      const result = await FileSystem.uploadAsync(uploadUrl, posterUri, {
        httpMethod: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      });
      if (result.status >= 300) {
        console.warn(`[UploadManager] thumbnail upload returned ${result.status}`);
      }
    } catch (error: any) {
      console.warn('[UploadManager] thumbnail upload failed (non-fatal):', error?.message);
    }
  }

  /* ------------------------------ pump ---------------------------- */

  private pump(): void {
    const now = Date.now();
    const all = [...this.entries.values()];
    const runnable = selectRunnable(all, now, [...this.running]);

    for (const entry of runnable) {
      this.running.add(entry.id);
      void this.run(entry.id).finally(() => {
        this.running.delete(entry.id);
        this.pump();
      });
    }

    this.armWakeTimer();
  }

  /** One timer for the whole queue, set to the soonest backoff deadline. */
  private armWakeTimer(): void {
    if (this.wakeTimer) {
      clearTimeout(this.wakeTimer);
      this.wakeTimer = null;
    }
    const at = nextWakeUpAt([...this.entries.values()], Date.now());
    if (at === null) return;
    this.wakeTimer = setTimeout(() => {
      this.wakeTimer = null;
      this.pump();
    }, Math.max(50, at - Date.now()));
  }

  private async run(entryId: string): Promise<void> {
    let entry: UploadEntry | null = this.entries.get(entryId) ?? null;
    if (!entry) return;

    try {
      // An entry whose file is still the picker's URI was rehydrated out of a
      // `preparing` state — the app died mid-copy. Prepare it again rather than
      // uploading from a cache path the OS may have reclaimed.
      if (!entry.localUri.startsWith(UPLOAD_DIR)) {
        await this.prepare(entryId);
        entry = this.entries.get(entryId) ?? null;
        if (!entry || entry.status === 'failed') return;
      }

      const action = slotAction(entry, Date.now());

      if (action !== 'complete-only') {
        const slot = await this.ensureSlot(entry, action);
        entry = this.update(entryId, {
          assetId: slot.assetId,
          provider: slot.provider,
          transport: slot.transport ?? null,
          uploadUrl: slot.uploadUrl,
          method: slot.method,
          expiresAt: slot.expiresAt ?? null,
          status: 'uploading',
          // A resumed chunked upload keeps its bar; the server's offset corrects
          // it as soon as the upload starts.
          progress: action === 'reuse' && slot.transport === 'tus' ? entry.progress : 0,
          error: null,
        });
        if (!entry) return;

        await this.pushBytes(entry);

        // Persisted BEFORE the completion call, and this ordering is the whole
        // point: from here on the bytes are on the server, so a crash or a
        // failed `complete` must never re-send them. A Cloudflare direct-upload
        // URL is single use — a second attempt would not even work.
        entry = this.update(entryId, { status: 'uploaded', progress: 1, error: null });
        if (!entry) return;

        // Best-effort poster, in the same run as the bytes (a resumed
        // complete-only run no longer holds the thumbnail URL).
        if (slot.thumbnailUploadUrl && entry.posterUri) {
          await this.pushThumbnail(entry.posterUri, slot.thumbnailUploadUrl);
        }
      }

      const assetId = entry.assetId;
      if (!assetId) throw new Error('Upload slot did not return an asset id');

      entry = this.update(entryId, { status: 'completing' });
      if (!entry) return;

      // A Cloudflare image can take a moment to leave its draft state.
      const done = entry;
      const asset = await retryWhileIncomplete(() => ContributorMediaService.completeUpload(done.itemId, assetId, {
        width: done.width,
        height: done.height,
        size_bytes: done.sizeBytes,
        mime_type: done.mime,
        duration_ms: done.durationMs,
      }));

      // Uploading into the cover slot does not make the image the cover. The
      // complete call writes `thumbnail_url` on the asset and stops there; only
      // promotion copies the bytes to the item's deterministic public key and
      // writes `cover_*` on the item. Without this, picking a cover uploaded a
      // file that nothing ever displayed — the teaser stayed blank.
      //
      // This has to happen BEFORE the entry flips to `ready`: the create screen
      // refetches the item the moment a cover entry reads ready, so promoting
      // afterwards refetches an item whose cover_url is still null and nothing
      // invalidates a second time. The upload succeeds and the form goes on
      // saying "No cover image".
      if (entry.role === 'cover') {
        try {
          await ContributorMediaService.setCoverFromAsset(entry.itemId, assetId);
        } catch (error: any) {
          // The bytes are stored and the asset is ready; only promotion failed.
          // Failing the whole entry would invite a retry that re-uploads them
          // for nothing, so surface it and let the upload stand.
          this.update(entryId, {
            error: error?.message || 'Uploaded, but could not be set as the cover',
          });
        }
      }

      this.applyAssetStatus(entryId, asset);
    } catch (error: any) {
      const current = this.entries.get(entryId);
      if (!current) return;
      const message = error?.message || 'Upload failed';
      this.commit(planFailure(current, Date.now(), message));
    }
  }

  /** `create` a slot, `retry` for a fresh one, or reuse what we hold. */
  private async ensureSlot(entry: UploadEntry, action: SlotAction): Promise<UploadSlot> {
    // A big video whose one-shot upload failed comes back as a resumable one,
    // on the same asset row: its old URL cannot be resumed, so it is replaced
    // rather than reused.
    if (entry.assetId && needsResumableSlot(entry)) {
      return ContributorMediaService.retryUpload(entry.itemId, entry.assetId, {
        transport: 'tus',
        size_bytes: entry.sizeBytes as number,
      });
    }

    if (action === 'reuse' && entry.assetId && entry.uploadUrl && entry.method) {
      return {
        assetId: entry.assetId,
        provider: entry.provider ?? 'supabase',
        transport: entry.transport ?? undefined,
        uploadUrl: entry.uploadUrl,
        method: entry.method,
        expiresAt: entry.expiresAt,
      };
    }

    if (action === 'retry' && entry.assetId) {
      return ContributorMediaService.retryUpload(
        entry.itemId,
        entry.assetId,
        shouldUseTus(entry) ? { transport: 'tus', size_bytes: entry.sizeBytes as number } : {},
      );
    }

    return ContributorMediaService.requestUpload(entry.itemId, this.slotRequest(entry));
  }

  /**
   * What to ask the server for. A resumable slot (a big video, after a failed
   * attempt) needs the exact size of the file `prepare` copied.
   */
  private slotRequest(entry: UploadEntry) {
    return {
      kind: entry.kind,
      role: entry.role,
      position: entry.position,
      ...(shouldUseTus(entry)
        ? { transport: 'tus' as const, size_bytes: entry.sizeBytes as number }
        // The size lets the server keep a photo over Cloudflare's 10 MB on Supabase.
        : entry.sizeBytes ? { size_bytes: entry.sizeBytes } : {}),
    };
  }

  /**
   * A resumable upload: ask the server how many bytes it holds, then send the
   * rest a chunk at a time, so a dropped connection costs at most one chunk —
   * the next attempt starts by asking for the offset again and carries on from
   * there. Each chunk is started from here, so the upload only advances while
   * the app is running.
   */
  private async pushTus(entry: UploadEntry): Promise<void> {
    const url = entry.uploadUrl as string;
    const total = entry.sizeBytes ?? 0;
    const chunkUri = `${UPLOAD_DIR}${entry.id}.chunk`;

    const gone = () => {
      // The URL names no upload any more. Drop it, so the retry asks for a new
      // slot instead of knocking on the same dead one.
      this.update(entry.id, { uploadUrl: null, progress: 0 });
      return new Error('The upload expired and has to start again');
    };

    const head = await fetch(url, { method: 'HEAD', headers: TUS_HEADERS });
    if (headSaysGone(head.status)) {
      // Every chunk was acknowledged and the app died before saying so: the
      // server may have retired a finished upload's URL. The bytes are there;
      // go on to the completion call rather than sending the file again.
      if (entry.progress >= 1) return;
      throw gone();
    }
    if (!head.ok) throw new Error(`Upload failed (HTTP ${head.status})`);
    let offset = readOffset({ 'upload-offset': head.headers.get('upload-offset') }) ?? 0;
    this.update(entry.id, { progress: tusProgress(offset, 0, total) });

    try {
      for (let chunk = nextChunk(offset, total); chunk; chunk = nextChunk(offset, total)) {
        // Cancelled between chunks: there was no task in flight to cancel, so
        // this is the only place the loop can notice.
        if (!this.entries.has(entry.id)) throw new Error('Upload was cancelled');
        const sent = chunk.position;
        const bytes = await FileSystem.readAsStringAsync(entry.localUri, {
          encoding: FileSystem.EncodingType.Base64,
          position: chunk.position,
          length: chunk.length,
        });
        await FileSystem.writeAsStringAsync(chunkUri, bytes, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const task = FileSystem.createUploadTask(
          url,
          chunkUri,
          {
            httpMethod: 'PATCH',
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
            headers: {
              ...TUS_HEADERS,
              'Upload-Offset': String(chunk.position),
              'Content-Type': 'application/offset+octet-stream',
            },
            sessionType: FileSystem.FileSystemSessionType.BACKGROUND,
          },
          ({ totalBytesSent }) => {
            this.reportProgress(entry.id, tusProgress(sent, totalBytesSent, total));
          },
        );

        this.tasks.set(entry.id, task);
        const result = await task.uploadAsync();
        if (!result) throw new Error('Upload was cancelled');
        if (isUploadGone(result.status)) throw gone();
        if (result.status >= 300) throw new Error(`Upload failed (HTTP ${result.status})`);

        // The server's own count, not ours: if it took fewer bytes than were
        // sent, the next chunk starts where it actually got to.
        offset = readOffset(result.headers) ?? chunk.position + chunk.length;
        // An acknowledgement that moves nothing would loop forever.
        if (offset <= chunk.position) throw new Error('Upload made no progress');
        // Stored, not just displayed, so a failure on the next chunk keeps the bar.
        this.update(entry.id, { progress: tusProgress(offset, 0, total) });
      }
    } finally {
      this.tasks.delete(entry.id);
      this.lastProgressAt.delete(entry.id);
      await FileSystem.deleteAsync(chunkUri, { idempotent: true }).catch(() => {});
    }
  }

  private async pushBytes(entry: UploadEntry): Promise<void> {
    if (entry.transport === 'tus') return this.pushTus(entry);

    const isMultipart = entry.method === 'POST';

    const options: FileSystem.FileSystemUploadOptions = isMultipart
      ? {
          // Cloudflare Direct Creator Upload: multipart POST, field name `file`.
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'file',
          mimeType: entry.mime,
          sessionType: FileSystem.FileSystemSessionType.BACKGROUND,
        }
      : {
          // Supabase signed URL: the raw bytes are the body.
          httpMethod: 'PUT',
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers: { 'Content-Type': entry.mime },
          sessionType: FileSystem.FileSystemSessionType.BACKGROUND,
        };

    const task = FileSystem.createUploadTask(
      entry.uploadUrl as string,
      entry.localUri,
      options,
      ({ totalBytesSent, totalBytesExpectedToSend }) => {
        if (!totalBytesExpectedToSend || totalBytesExpectedToSend <= 0) return;
        this.reportProgress(entry.id, totalBytesSent / totalBytesExpectedToSend);
      },
    );

    this.tasks.set(entry.id, task);
    try {
      const result = await task.uploadAsync();
      if (!result) throw new Error('Upload was cancelled');
      if (result.status >= 300) {
        throw new Error(`Upload failed (HTTP ${result.status})`);
      }
    } finally {
      this.tasks.delete(entry.id);
      this.lastProgressAt.delete(entry.id);
    }
  }

  /** Throttled: an upload emits progress far faster than React can render it. */
  private reportProgress(entryId: string, raw: number): void {
    const entry = this.entries.get(entryId);
    if (!entry) return;

    const progress = clampProgress(raw);
    const now = Date.now();
    const last = this.lastProgressAt.get(entryId) ?? 0;
    if (now - last < PROGRESS_THROTTLE_MS && Math.abs(progress - entry.progress) < PROGRESS_EPSILON) {
      return;
    }
    this.lastProgressAt.set(entryId, now);

    // Replaced, never mutated. See `commit()` — anything that has been through
    // a dispatch is frozen by immer, and `entry.progress = …` threw on the
    // first tick of every upload, so progress never moved.
    this.entries.set(entryId, { ...entry, progress });
    // Not persisted from here: a tick is meaningless after a restart (the
    // native task is gone) and it would mean an AsyncStorage write per 100 kB.
    // A chunked upload stores its progress once per acknowledged chunk instead.
    store.dispatch(entryProgressed({ id: entryId, progress }));
  }

  /* --------------------------- processing ------------------------- */

  private applyAssetStatus(entryId: string, asset: ContributorAsset): void {
    if (asset.status === 'failed') {
      this.update(entryId, {
        status: 'failed',
        attempts: Number.MAX_SAFE_INTEGER, // the server rejected it; bytes won't help
        error: asset.error || 'The server could not process this file',
      });
      return;
    }

    if (asset.status === 'ready') {
      this.update(entryId, { status: 'ready', progress: 1, error: null });
      return;
    }

    this.update(entryId, { status: 'processing', progress: 1, error: null });
    this.pollProcessing(entryId, Date.now() + PROCESSING_TIMEOUT_MS);
  }

  /**
   * Poll a transcoding asset to `ready`.
   *
   * `useAssetStatus` polls too, for whatever screen is open; this one exists so
   * a queue entry still settles when no screen is watching, which is what
   * "publish when ready" depends on.
   */
  private pollProcessing(entryId: string, deadline: number): void {
    const existing = this.pollTimers.get(entryId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      this.pollTimers.delete(entryId);
      const entry = this.entries.get(entryId);
      if (!entry || entry.status !== 'processing' || !entry.assetId) return;

      try {
        const asset = await ContributorMediaService.getAsset(entry.itemId, entry.assetId);
        if (asset.status === 'ready') {
          this.update(entryId, { status: 'ready', progress: 1, error: null });
          return;
        }
        if (asset.status === 'failed') {
          this.update(entryId, {
            status: 'failed',
            attempts: Number.MAX_SAFE_INTEGER,
            error: asset.error || 'Processing failed',
          });
          return;
        }
      } catch {
        // A poll failure is not an upload failure — the bytes are delivered.
        // Keep waiting until the deadline.
      }

      if (Date.now() < deadline) this.pollProcessing(entryId, deadline);
      else this.update(entryId, { status: 'failed', attempts: Number.MAX_SAFE_INTEGER,
        error: 'Still processing after 15 minutes' });
    }, PROCESSING_POLL_MS);

    this.pollTimers.set(entryId, timer);
  }

  /* ------------------------------ commands ------------------------ */

  /** Manual retry: restarts the backoff ladder and runs immediately. */
  retry(entryId: string): void {
    const entry = this.entries.get(entryId);
    if (!entry) return;
    this.commit(planManualRetry(entry, Date.now()));
    this.pump();
  }

  retryAllFailed(): void {
    for (const entry of this.entries.values()) {
      if (entry.status === 'failed') this.retry(entry.id);
    }
  }

  /**
   * Drop an entry, its local file and — if a slot was ever granted — the asset
   * row behind it. Deleting the row is best-effort: an orphan on the server is
   * recoverable, a stuck row in the UI is not.
   */
  async cancel(entryId: string): Promise<void> {
    const entry = this.entries.get(entryId);
    if (!entry) return;

    this.tasks.get(entryId)?.cancelAsync?.().catch(() => {});
    this.tasks.delete(entryId);
    const timer = this.pollTimers.get(entryId);
    if (timer) clearTimeout(timer);
    this.pollTimers.delete(entryId);

    this.entries.delete(entryId);
    store.dispatch(entryRemoved(entryId));
    await this.persist();

    if (entry.assetId) {
      try {
        await ContributorMediaService.deleteAsset(entry.itemId, entry.assetId);
      } catch {
        // ignore
      }
    }
    await this.deleteLocalFiles(entry);
    this.pump();
  }

  /** Forget every entry for an item (used after the item itself is deleted). */
  async clearItem(itemId: string): Promise<void> {
    const ids = [...this.entries.values()]
      .filter((entry) => entry.itemId === itemId)
      .map((entry) => entry.id);
    for (const id of ids) {
      const entry = this.entries.get(id);
      this.tasks.get(id)?.cancelAsync?.().catch(() => {});
      this.tasks.delete(id);
      this.entries.delete(id);
      if (entry) await this.deleteLocalFiles(entry);
    }
    store.dispatch(itemCleared(itemId));
    await this.persist();
  }

  /** Drop finished entries and their local copies. */
  async clearFinished(): Promise<void> {
    const done = [...this.entries.values()].filter((entry) => entry.status === 'ready');
    for (const entry of done) {
      this.entries.delete(entry.id);
      store.dispatch(entryRemoved(entry.id));
      await this.deleteLocalFiles(entry);
    }
    await this.persist();
  }

  /** Start (or re-start) the pump. Safe to call at any time. */
  resume(): void {
    this.pump();
  }

  getEntries(): UploadEntry[] {
    return [...this.entries.values()];
  }

  entriesByIds(ids: readonly string[]): UploadEntry[] {
    return ids.map((id) => this.entries.get(id)).filter((e): e is UploadEntry => !!e);
  }

  readinessFor(ids: readonly string[]): QueueReadiness {
    return readiness(this.entriesByIds(ids));
  }

  /**
   * Claim an asset row for every entry that does not have one yet.
   *
   * Quick Post submits with `publish_when_ready` before a single byte has
   * landed, and the worker publishes off **asset rows** — an entry that has
   * never been granted a slot would simply be left behind, and the item would
   * go live short. Reserving up front is a handful of small POSTs and it also
   * surfaces a scope or `max_gallery_assets` rejection immediately rather than
   * halfway through a stadium upload.
   *
   * Never throws: a failure is folded into the entry through the normal
   * backoff, and the caller decides what to do by reading `canPublishWhenReady`.
   */
  async reserveSlots(ids: readonly string[], concurrency = 3): Promise<void> {
    const pending = this.entriesByIds(ids).filter(
      // `running` is populated synchronously by `pump()`, so an entry that is
      // not in it has definitely not reached `ensureSlot` yet — which is what
      // keeps this from creating a second slot for the same file.
      (entry) => !entry.assetId && entry.status !== 'failed' && !this.running.has(entry.id),
    );

    for (let i = 0; i < pending.length; i += concurrency) {
      await Promise.all(
        pending.slice(i, i + concurrency).map(async (entry) => {
          try {
            const slot = await ContributorMediaService.requestUpload(
              entry.itemId,
              this.slotRequest(entry),
            );
            this.update(entry.id, {
              assetId: slot.assetId,
              provider: slot.provider,
              transport: slot.transport ?? null,
              uploadUrl: slot.uploadUrl,
              method: slot.method,
              expiresAt: slot.expiresAt ?? null,
            });
          } catch (error: any) {
            const current = this.entries.get(entry.id);
            if (!current) return;
            this.commit(
              planFailure(current, Date.now(), error?.message || 'Could not reserve an upload slot'),
            );
          }
        }),
      );
    }
    this.pump();
  }

  /* ------------------------------ plumbing ------------------------ */

  /** The copied original, its poster, and a chunk left behind by a kill. */
  private async deleteLocalFiles(entry: UploadEntry): Promise<void> {
    for (const uri of [entry.localUri, entry.posterUri, `${UPLOAD_DIR}${entry.id}.chunk`]) {
      if (!uri) continue;
      await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
    }
  }

  /**
   * Store an entry and publish it.
   *
   * The dispatched value is a **copy**. Redux Toolkit's immer deep-freezes
   * everything that reaches the store, so handing it the manager's own object
   * would freeze the manager's object too — and the next write to it would
   * throw. Keeping the two apart makes that whole class of bug impossible
   * rather than relying on every call site remembering to spread.
   */
  private commit(entry: UploadEntry): UploadEntry {
    this.entries.set(entry.id, entry);
    store.dispatch(entryUpserted({ ...entry }));
    void this.persist();
    return entry;
  }

  private update(entryId: string, patch: Partial<UploadEntry>): UploadEntry | null {
    const entry = this.entries.get(entryId);
    if (!entry) return null;
    return this.commit({ ...entry, ...patch, updatedAt: Date.now() });
  }

  /**
   * Coalesced write. Several entries change status within the same tick during
   * a pump; one serialise per tick is plenty.
   */
  private async persist(): Promise<void> {
    if (this.persistQueued) return;
    this.persistQueued = true;
    await Promise.resolve();
    this.persistQueued = false;
    try {
      await AsyncStorage.setItem(
        UPLOAD_QUEUE_STORAGE_KEY,
        serializeQueue([...this.entries.values()]),
      );
    } catch {
      // Losing the persisted copy costs a resume, not the upload in flight.
    }
  }
}

const UploadManager = new UploadManagerClass();
export default UploadManager;
