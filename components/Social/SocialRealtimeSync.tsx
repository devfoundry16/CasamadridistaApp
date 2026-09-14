import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { socialKeys } from '@/hooks/social/keys';
import { useMyProfile } from '@/hooks/social/useProfile';
import { clearThreadCache } from '@/hooks/social/useThread';
import { useUser } from '@/hooks/useUser';
import SocialService from '@/services/SocialService';
import { ensureRealtimeAuth, subscribeUser, trackOwnPresence, untrackOwnPresence } from '@/services/social/realtime';

/**
 * Keeps Casa Social live app-wide. Renders nothing; mounted once in the root
 * layout, inside the router (it reads the pathname).
 *
 *   - authenticates Realtime with the app's token;
 *   - listens on `user:<me>`: every new message refreshes the header badge and
 *     the inbox, and acknowledges DELIVERY at once — the device has it, which is
 *     what the sender's ✓✓ means — unless that thread is already open, where
 *     the thread acknowledges READ instead;
 *   - tracks this user's presence while the app is in the foreground, and only
 *     while they show activity (§18; the server refuses it otherwise anyway);
 *   - on an identity change, drops every social query and cached thread, so
 *     nothing from the previous account is ever shown to the next one.
 */
export default function SocialRealtimeSync() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  const previousUser = useRef<string | null | undefined>(undefined);
  const { data: me } = useMyProfile();
  const userId = user?.id ?? null;
  const showActivity = me?.user.show_activity !== false;

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (previousUser.current !== undefined && previousUser.current !== userId) {
      queryClient.removeQueries({ queryKey: socialKeys.all });
      clearThreadCache();
    }
    previousUser.current = userId;
  }, [userId, queryClient]);

  useEffect(() => {
    if (!userId) return;
    let off: (() => void) | null = null;
    let cancelled = false;

    void ensureRealtimeAuth().then(() => {
      if (cancelled) return;
      off = subscribeUser(userId, (event) => {
        void queryClient.invalidateQueries({ queryKey: socialKeys.unread() });
        void queryClient.invalidateQueries({ queryKey: socialKeys.inbox('inbox') });
        void queryClient.invalidateQueries({ queryKey: socialKeys.inbox('requests') });
        const inThread = pathRef.current === `/social/chat/${event.conversation_id}`;
        if (event.sender_id !== userId && !inThread) {
          void SocialService.acknowledge(event.conversation_id, { delivered_at: event.created_at }).catch(() => {});
        }
      });
    });

    return () => {
      cancelled = true;
      off?.();
    };
  }, [userId, queryClient]);

  useEffect(() => {
    if (!userId || !showActivity) {
      void untrackOwnPresence();
      return;
    }
    void trackOwnPresence(userId);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void trackOwnPresence(userId);
        void queryClient.invalidateQueries({ queryKey: socialKeys.unread() });
      } else {
        void untrackOwnPresence();
      }
    });
    return () => {
      sub.remove();
      void untrackOwnPresence();
    };
  }, [userId, showActivity, queryClient]);

  return null;
}
