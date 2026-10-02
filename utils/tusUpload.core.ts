/**
 * The pure half of a resumable (tus 1.0) video upload.
 *
 * Zero imports, so `utils/__tests__/tusUpload.test.mts` runs it under
 * `node --test`. `services/upload/UploadManager.ts` owns the I/O: it asks the
 * server how many bytes it holds, cuts the next chunk out of the file and
 * PATCHes it, and after a dropped connection carries on from the server's
 * offset instead of sending the whole file again.
 */

/**
 * Bytes per PATCH. Cloudflare Stream requires every chunk but the last to be
 * at least 5 MiB and a multiple of 256 KiB; 8 MiB is 32 of them. Small enough
 * that a failed chunk costs little on a stadium connection, large enough that
 * a 200 MB clip is 25 requests rather than hundreds.
 */
export const TUS_CHUNK_BYTES = 8 * 1024 * 1024;

/** Every tus request names the protocol version. */
export const TUS_HEADERS = { 'Tus-Resumable': '1.0.0' } as const;

export interface TusChunk {
  /** Byte offset in the file, which is also the `Upload-Offset` to send. */
  position: number;
  length: number;
}

/** The chunk to send next, or null when the server already holds the file. */
export function nextChunk(
  offset: number,
  totalBytes: number,
  chunkBytes: number = TUS_CHUNK_BYTES,
): TusChunk | null {
  if (!Number.isFinite(offset) || offset < 0) return null;
  if (!Number.isFinite(totalBytes) || totalBytes <= 0) return null;
  if (offset >= totalBytes) return null;
  return { position: offset, length: Math.min(chunkBytes, totalBytes - offset) };
}

/**
 * The `Upload-Offset` the server answered with: how many bytes it holds.
 * Header names are case-insensitive and native upload results do not agree on
 * a casing.
 */
export function readOffset(headers: Record<string, unknown> | null | undefined): number | null {
  if (!headers) return null;
  const key = Object.keys(headers).find((name) => name.toLowerCase() === 'upload-offset');
  if (!key) return null;
  const raw = String(headers[key]).trim();
  if (!/^\d+$/.test(raw)) return null;
  return Number(raw);
}

/** 0..1: what the server holds, plus the part of the chunk in flight. */
export function tusProgress(offset: number, sentInChunk: number, totalBytes: number): number {
  if (!Number.isFinite(totalBytes) || totalBytes <= 0) return 0;
  return Math.min(1, Math.max(0, (offset + sentInChunk) / totalBytes));
}

/**
 * A PATCH answer that means the upload URL no longer names an upload. Carrying
 * on is impossible; the entry needs a fresh slot.
 */
export function isUploadGone(status: number): boolean {
  return status === 404 || status === 410;
}

/**
 * The offset check (HEAD) could not find an upload to carry on.
 *
 * Any client error counts, not just 404/410: an expired or refused upload is
 * answered differently by different servers, and retrying the same URL four
 * times helps with none of them. A locked (423) or rate-limited (429) upload
 * is still there, and so is one behind a server error.
 */
export function headSaysGone(status: number): boolean {
  return status >= 400 && status < 500 && status !== 423 && status !== 429;
}

interface Sized {
  kind: 'image' | 'video';
  role: 'content' | 'cover';
  sizeBytes: number | null;
  /** Failed attempts so far. */
  attempts: number;
}

/**
 * Whether the NEXT slot for a file should be a resumable one.
 *
 * The first attempt is always a single request: the OS carries a one-shot
 * upload to the end with the app in the background, which is how a
 * correspondent publishes and pockets the phone. Chunks are started from
 * JavaScript, so a chunked upload stalls while the app is suspended. Once an
 * attempt has failed the connection has proved itself bad, and from then on a
 * content video too big for one chunk goes up in chunks, so no later failure
 * costs more than one of them.
 *
 * Photos and covers go to storage that does not speak tus, and the size has to
 * be known — the server creates the upload with it.
 */
export function shouldUseTus(entry: Sized): boolean {
  return (
    entry.attempts > 0 &&
    entry.kind === 'video' &&
    entry.role === 'content' &&
    typeof entry.sizeBytes === 'number' &&
    entry.sizeBytes > TUS_CHUNK_BYTES
  );
}

/**
 * A failed one-shot upload that should come back as a resumable one. Its slot
 * is replaced rather than reused: a one-shot URL cannot be resumed.
 */
export function needsResumableSlot(entry: Sized & { transport: 'direct' | 'tus' | null }): boolean {
  return entry.transport !== 'tus' && shouldUseTus(entry);
}
