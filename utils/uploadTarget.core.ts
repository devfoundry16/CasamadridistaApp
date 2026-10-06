/**
 * How the bytes of an upload slot are sent, and the retry for a completion
 * that reaches the server before the store has the file.
 *
 * A Supabase slot takes a raw PUT; a Cloudflare Images slot a multipart POST
 * with field `file`. The app tells the server it can do both
 * (`upload_methods`), so the server may hand it either kind of slot.
 *
 * No React Native imports, so `node --test` covers it
 * (utils/__tests__/imageUpload.test.mts). The upload itself is in
 * services/upload/uploadToSlot.ts.
 */

/** Sent as `upload_methods` with every slot request. */
export const UPLOAD_METHODS = ['put', 'post'] as const;

export interface SlotTarget {
  method?: string | null;
  field?: string | null;
}

export type UploadPlan =
  | { kind: 'binary'; httpMethod: 'PUT'; headers: Record<string, string> }
  | { kind: 'multipart'; httpMethod: 'POST'; fieldName: string; mimeType: string };

export function uploadPlan(target: SlotTarget, mimeType: string): UploadPlan {
  if (String(target?.method ?? '').toUpperCase() === 'POST') {
    return { kind: 'multipart', httpMethod: 'POST', fieldName: target.field || 'file', mimeType };
  }
  return { kind: 'binary', httpMethod: 'PUT', headers: { 'Content-Type': mimeType } };
}

const INCOMPLETE = new Set(['upload_incomplete', 'upload_missing', 'attachment_not_uploaded']);

/** The server's answer for a file the store does not have yet. */
export function isUploadIncomplete(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: unknown; message?: unknown };
  return INCOMPLETE.has(String(e.code ?? '')) || INCOMPLETE.has(String(e.message ?? ''));
}

/**
 * Run `fn`, retrying while the server says the upload is not there yet: a
 * Cloudflare image can take a moment to leave its draft state after the POST
 * returns. Backs off (delay, 2×delay, …); any other error is thrown at once.
 */
export async function retryWhileIncomplete<T>(
  fn: () => Promise<T>,
  { tries = 3, delayMs = 800, sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)) }: { tries?: number; delayMs?: number; sleep?: (ms: number) => Promise<void> } = {},
): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= tries || !isUploadIncomplete(err)) throw err;
      await sleep(delayMs * attempt);
    }
  }
}
