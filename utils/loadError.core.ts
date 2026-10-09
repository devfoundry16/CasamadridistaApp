/**
 * Telling "it is gone" from "it did not load", for a screen that loads one
 * thing. Pure, so `node --test` covers it.
 *
 * A service attaches the HTTP status to the error it throws (CasaMediaService
 * `fail`); a raw axios error carries it on `response`.
 */

export function httpStatusOf(error: unknown): number | null {
  const e = error as { status?: unknown; response?: { status?: unknown } } | null;
  const status = e?.status ?? e?.response?.status;
  return typeof status === 'number' ? status : null;
}

/** 404 or 410: the thing was removed or never existed. Retrying cannot help. */
export function isGone(error: unknown): boolean {
  const status = httpStatusOf(error);
  return status === 404 || status === 410;
}

/** React Query `retry`: three tries for a failure to load, none for something gone. */
export function retryUnlessGone(failureCount: number, error: unknown): boolean {
  return !isGone(error) && failureCount < 3;
}

/**
 * The Error a service throws for a failed request: the server's message (or
 * the fallback) with the HTTP status kept on it, and no `status` at all when
 * there was no response. Shared by CasaMediaService and ContributorMediaService.
 */
export function loadError(error: any, fallback: string): Error & { status?: number } {
  const failure: Error & { status?: number } = new Error(error?.response?.data?.error || fallback);
  const status = error?.response?.status;
  if (typeof status === 'number') failure.status = status;
  return failure;
}
