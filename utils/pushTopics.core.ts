/**
 * Which push topics this device registers with, and the "Social activity"
 * switch that adds or removes one of them.
 *
 * Pure, so `utils/__tests__/pushTopics.test.mts` runs it under `node --test`.
 *
 * Registration sends the whole topic list and the backend overwrites the row's
 * topics with it, so the switch has to be remembered on the device: otherwise
 * the next launch would register `social` again and quietly undo it.
 */

/** Always registered: Casa Media campaigns and direct messages. */
export const BASE_TOPICS = ['media', 'dm'] as const;

/** Likes, comments, mentions, tags and friend requests (`deviceRules.TOPICS`). */
export const SOCIAL_TOPIC = 'social';

/** AsyncStorage key for the switch. Absent means on. */
export const SOCIAL_PREF_KEY = 'push_social_enabled';

export function registrationTopics(socialOn: boolean): string[] {
  return socialOn ? [...BASE_TOPICS, SOCIAL_TOPIC] : [...BASE_TOPICS];
}

/** `topics` with `topic` switched on or off. Every other topic is kept, in order. */
export function withTopic(topics: readonly string[], topic: string, on: boolean): string[] {
  const rest = [...new Set(topics)].filter((t) => t !== topic);
  return on ? [...rest, topic] : rest;
}

/** Social pushes are on unless the person switched them off. */
export function parseSocialPref(stored: string | null | undefined): boolean {
  return stored !== '0';
}

export function serialiseSocialPref(on: boolean): string {
  return on ? '1' : '0';
}
