import { useEffect, useState } from 'react';

import { watchPresence } from '@/services/social/realtime';
import { presenceLabel, type PresenceLabel } from '@/utils/chat.core';

/**
 * Online / "active 5m ago" for one person (§18).
 *
 * Online comes from the realtime presence channel, which the server only lets a
 * friend or an accepted conversation partner join, and only while the person
 * shows activity. `lastActiveAt` comes from the API under the same rule, so a
 * viewer who is not allowed simply sees nothing.
 */
export function usePresence(userId: string | undefined, lastActiveAt: string | null | undefined): PresenceLabel {
  const [online, setOnline] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!userId) return;
    setOnline(false);
    return watchPresence(userId, setOnline);
  }, [userId]);

  // "5m ago" should not freeze while the screen stays open.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  return presenceLabel(online, lastActiveAt ?? null, now);
}

/**
 * Which of these people are online right now, for a list (the friends
 * screen's Online section). One presence channel per person, so pass only
 * people the server will admit — friends who show their activity — and keep
 * the list to a page: a refused join would be retried for as long as it is
 * watched, and a connection has a limited number of channels.
 */
export function useOnlineIds(userIds: readonly string[]): ReadonlySet<string> {
  const [online, setOnline] = useState<ReadonlySet<string>>(new Set());
  const key = userIds.join(',');

  useEffect(() => {
    const ids = key ? key.split(',') : [];
    setOnline(new Set());
    const offs = ids.map((id) =>
      watchPresence(id, (isOnline) =>
        setOnline((current) => {
          if (current.has(id) === isOnline) return current;
          const next = new Set(current);
          if (isOnline) next.add(id);
          else next.delete(id);
          return next;
        }),
      ),
    );
    return () => offs.forEach((off) => off());
  }, [key]);

  return online;
}
