/**
 * Following a person, on the app side, as pure logic. Zero imports, so
 * `utils/__tests__/follow.test.mts` runs it under `node --test`.
 *
 * A follow is one way and needs no approval, apart from friend requests.
 */

interface FollowProfile {
  stats: { followers: number };
  relationship: { state: string; following: boolean };
}

/**
 * The profile as it reads once the viewer follows (or stops following):
 * `following` set and the follower count moved by one, never below zero.
 * The same state again changes nothing.
 */
export function withFollow<P extends FollowProfile>(profile: P, following: boolean): P {
  if (profile.relationship.following === following) return profile;
  return {
    ...profile,
    relationship: { ...profile.relationship, following },
    stats: { ...profile.stats, followers: Math.max(0, profile.stats.followers + (following ? 1 : -1)) },
  };
}

/** Whether the Follow button shows: anyone but yourself, and no block either way. */
export function canFollow(state: string): boolean {
  return state !== 'self' && state !== 'blocking' && state !== 'blocked';
}
