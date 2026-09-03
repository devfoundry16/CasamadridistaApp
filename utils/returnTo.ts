import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetAuthRedirectClaim } from './authRedirectLatch';
import {
  RETURN_TO_STORAGE_KEY,
  buildReturnTo,
  consumeReturnTo,
  parseReturnTo,
  type PendingReturnTo,
  type PendingReturnToInput,
} from './returnTo.core';

export {
  RETURN_TO_TTL_MS,
  type PendingReturnTo,
  type PendingReturnToInput,
} from './returnTo.core';

/**
 * Where to send the user once they finish signing in.
 *
 * AsyncStorage rather than in-memory state on purpose: Google sign-in leaves the
 * app for a browser and comes back through a deeplink, and a cold start in
 * between would lose anything held in a module variable or in Redux.
 */
export async function setPendingReturnTo(input: PendingReturnToInput): Promise<void> {
  const entry = buildReturnTo(input, Date.now());
  if (!entry) return;
  // A new intent starts a new auth episode, so the redirect latch reopens.
  resetAuthRedirectClaim();
  try {
    await AsyncStorage.setItem(RETURN_TO_STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // A failed write only costs the redirect; never block the auth flow for it.
  }
}

/** Read-and-clear. Returns null when nothing is pending or the entry expired. */
export async function consumePendingReturnTo(): Promise<PendingReturnTo | null> {
  try {
    const raw = await AsyncStorage.getItem(RETURN_TO_STORAGE_KEY);
    const entry = consumeReturnTo(raw, Date.now());
    if (raw !== null) await AsyncStorage.removeItem(RETURN_TO_STORAGE_KEY);
    return entry;
  } catch {
    return null;
  }
}

/** Peek without clearing — used by the login modal to label its CTA. */
export async function peekPendingReturnTo(): Promise<PendingReturnTo | null> {
  try {
    return parseReturnTo(await AsyncStorage.getItem(RETURN_TO_STORAGE_KEY));
  } catch {
    return null;
  }
}

export async function clearPendingReturnTo(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RETURN_TO_STORAGE_KEY);
  } catch {
    // ignore
  }
}
