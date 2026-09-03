/**
 * Single-flight latch for the post-authentication redirect.
 *
 * A successful sign-in can be observed by two independent listeners at once:
 * `hooks/useAuthCallbackDeeplink.ts` (the OAuth deeplink handler) and
 * `components/Auth/AuthForm.tsx`'s `user?.id` effect. Both call
 * `finishAuthRedirect()`, and that function is not atomic — it awaits
 * `consumePendingReturnTo()`, which is a read-then-delete against AsyncStorage.
 *
 * Two failure modes, and they need different guards:
 *
 *  - **Concurrent.** Both calls read the pending entry before either deletes it,
 *    or one reads `null` and redirects to the account tab. Guarded by returning
 *    the in-flight promise to the second caller.
 *  - **Sequential.** The first call completes and redirects; the second starts
 *    afterwards, finds nothing pending, and replaces the destination with the
 *    default — silently undoing the round-trip. Guarded by `claimed`, which
 *    stays latched until a *new* pending returnTo is written.
 *
 * Lives in its own module so `utils/returnTo.ts` can reset the latch without an
 * import cycle through `utils/finishAuthRedirect.ts`.
 */

let inFlight: Promise<void> | null = null;
let claimed = false;

/** Called by `setPendingReturnTo`: a new intent opens a new auth episode. */
export function resetAuthRedirectClaim(): void {
  claimed = false;
}

export function isAuthRedirectClaimed(): boolean {
  return claimed;
}

/**
 * Runs `task` at most once per auth episode. A caller that arrives while the
 * task is running awaits the same promise; one that arrives after it finished
 * gets a no-op.
 */
export function claimAuthRedirect(task: () => Promise<void>): Promise<void> {
  if (inFlight) return inFlight;
  if (claimed) return Promise.resolve();

  claimed = true;
  inFlight = task().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
