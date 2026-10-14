/**
 * Video playback speed, as pure logic. Zero imports, so `node --test` loads it.
 * A viewer's choice for any video, kept for the session like mute.
 */

export const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

/** The next speed on a tap: 1 → 1.5 → 2 → 0.5 → 1. An unknown value starts again at 1. */
export function nextSpeed(current: number): PlaybackSpeed {
  switch (current) {
    case 1:
      return 1.5;
    case 1.5:
      return 2;
    case 2:
      return 0.5;
    default:
      return 1;
  }
}

/** "0.5×", "1×", "1.5×", "2×": digits and ×, the same in every language. */
export function speedLabel(speed: number): string {
  return `${speed}×`;
}
