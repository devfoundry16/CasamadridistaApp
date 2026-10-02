/**
 * The pure half of maintenance mode: recognising the backend's refusal.
 *
 * A deployment that is closed for maintenance answers every API request with
 * a 503 whose JSON body carries `maintenance: true` and an optional `message`
 * (backend `middleware/maintenanceMode.js`). Both the status and the flag are
 * required. A bare 503 is what a proxy or a crashed server returns, and
 * treating that as maintenance would lock everyone out over a blip.
 *
 * Zero imports, so `utils/__tests__/maintenance.test.mts` runs it under
 * `node --test`.
 */

export type MaintenanceNotice = {
  /** The server's own wording, or null to use the app's translated default. */
  message: string | null;
};

/** `body` is the parsed JSON, or the raw response text as `fetch` gives it. */
export function readMaintenance(status: number, body: unknown): MaintenanceNotice | null {
  if (status !== 503) return null;

  let parsed = body;
  if (typeof body === 'string') {
    try {
      parsed = JSON.parse(body);
    } catch {
      return null;
    }
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;

  const { maintenance, message } = parsed as { maintenance?: unknown; message?: unknown };
  if (maintenance !== true) return null;

  const text = typeof message === 'string' ? message.trim() : '';
  return { message: text || null };
}

/** Thrown by the startup config fetch when the backend is in maintenance. */
export class MaintenanceError extends Error {
  notice: MaintenanceNotice;

  constructor(notice: MaintenanceNotice) {
    super(notice.message ?? 'Service is under maintenance');
    this.name = 'MaintenanceError';
    this.notice = notice;
  }
}

export type MaintenanceState = {
  active: boolean;
  message: string | null;
};

export const NO_MAINTENANCE: MaintenanceState = { active: false, message: null };

/**
 * The maintenance state after a failed startup config fetch. Only the
 * backend's own refusal changes it: being offline is not maintenance, and a
 * retry that fails for another reason is not proof that maintenance is over.
 * A fetch that succeeds ends it (`NO_MAINTENANCE`).
 */
export function maintenanceAfterFailure(current: MaintenanceState, error: unknown): MaintenanceState {
  if (error instanceof MaintenanceError) return { active: true, message: error.notice.message };
  return current;
}
