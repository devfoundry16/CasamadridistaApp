/**
 * Whether a push registration needs to reach the server again.
 *
 * Pure, so `node --test` can load it. PushService records the last
 * registration the server accepted and asks this before every POST: the server
 * upserts on the token, so re-sending the same token, account and topics does
 * nothing but cost a request. On a real iPhone the token listener can fire many
 * times in a row, and each POST used to go out regardless.
 */

export interface PushRegistrationKey {
  token: string;
  /** The signed-in account, or null for an anonymous install. */
  userId: string | null;
  /** The topics sent, as one comparable string. */
  topicsKey: string;
}

export function shouldRegister(last: PushRegistrationKey | null, next: PushRegistrationKey): boolean {
  if (!last) return true;
  return last.token !== next.token || last.userId !== next.userId || last.topicsKey !== next.topicsKey;
}

/**
 * The options the push-token listener fetches the Expo token with. They MUST
 * carry the event's device token: without it getExpoPushTokenAsync asks APNs
 * again, which fires the listener again (expo-notifications warns about this
 * loop; on a real iPhone it POSTed the device 20+ times a second).
 */
export function listenerTokenOptions<T>(projectId: string, devicePushToken: T): { projectId: string; devicePushToken: T } {
  return { projectId, devicePushToken };
}
