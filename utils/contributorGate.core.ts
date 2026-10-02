/**
 * The contributor area's front door, as a decision.
 *
 * Pure, so the cases can be exercised under `node --test`; the component
 * (`components/Contributor/ContributorGate.tsx`) only renders what this says.
 */

/** The caller's own contributor grant, from `GET /contributor/invite`. */
export interface ContributorInvite {
  status: 'invited' | 'active' | 'suspended' | 'deactivated' | string;
  display_name?: string | null;
  invited_at?: string | null;
}

export interface GateInput {
  signedIn: boolean;
  loading: boolean;
  /** `/contributor/me`, when it answered. */
  me: { contributor: unknown; isMediaManager: boolean } | null;
  /** Why `/contributor/me` did not answer. `status` is absent on a transport failure. */
  error: { status?: number; message?: string } | null;
  /** `undefined` = not answered yet; `null` = this account was never invited. */
  invite: ContributorInvite | null | undefined;
}

export type GateState =
  | { kind: 'signedOut' }
  | { kind: 'loading' }
  | { kind: 'ready' }
  | { kind: 'invited'; invite: ContributorInvite }
  /** The server said no on purpose: show its sentence, offer no retry. */
  | { kind: 'refused'; message: string }
  /** The request did not get an answer: retryable. */
  | { kind: 'failed'; message: string }
  | { kind: 'notContributor' };

export function gateState(input: GateInput): GateState {
  if (!input.signedIn) return { kind: 'signedOut' };
  if (input.loading) return { kind: 'loading' };

  if (input.error || !input.me) {
    const status = input.error?.status;
    const message = input.error?.message ?? '';
    // 401 is handled by the global axios interceptor, so a 4xx that reaches
    // here is the server answering, not the network failing.
    const refused = status !== undefined && status >= 403 && status < 500;
    if (!refused) return { kind: 'failed', message };

    // An invited account is refused exactly like a stranger. Whether it has an
    // open invitation is a second question, and until that is answered there
    // is nothing true to show.
    if (input.invite === undefined) return { kind: 'loading' };
    if (input.invite?.status === 'invited') return { kind: 'invited', invite: input.invite };
    return { kind: 'refused', message };
  }

  if (!input.me.contributor && !input.me.isMediaManager) return { kind: 'notContributor' };
  return { kind: 'ready' };
}

/**
 * Whether the account tab shows the contributor entry, from `GET /auth/roles`.
 *
 * An invited account sees it: that is where the invitation is accepted. A
 * suspended or deactivated one does not.
 */
export function showsContributorEntry(
  roles: { mediaContributor?: { status?: string } | null; mediaManager?: boolean } | null | undefined,
): boolean {
  if (!roles) return false;
  if (roles.mediaManager === true) return true;
  const status = roles.mediaContributor?.status;
  return status === 'active' || status === 'invited';
}
