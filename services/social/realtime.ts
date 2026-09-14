import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from '@/config/supabase';
import AuthService from '@/services/AuthService';
import type { RealtimeMessageEvent, RealtimeReceiptEvent } from '@/types/social';

/**
 * Casa Social's Realtime connection.
 *
 * Every topic is a PRIVATE channel, authorised by the RLS policies on
 * `realtime.messages` in `backend/supabase/migrations/casa_social_realtime.sql`:
 *
 *   conversation:<id>  receive-only: message, receipt, message_removed
 *   typing:<id>        participants send and receive `typing`
 *   user:<uid>         receive-only: `inbox` for the header badge
 *   presence:<uid>     that user tracks; friends and accepted partners watch
 *
 * Authentication is the app's own access token via `realtime.setAuth`, kept in
 * step through `AuthService.onTokenChange`. See that method for why this does
 * not use `supabase.auth.setSession`.
 *
 * Channels are reference-counted by topic, so two screens watching the same
 * conversation share one subscription and the last to leave closes it.
 */

type Listener = (payload: any) => void;

interface Entry {
  channel: RealtimeChannel;
  refs: number;
  listeners: Map<string, Set<Listener>>;
  /** Notified on every presence sync/join/leave. */
  presenceListeners: Set<() => void>;
  joined: boolean;
  onJoined: Set<() => void>;
}

const entries = new Map<string, Entry>();
let authReady: Promise<void> | null = null;
let currentToken: string | null = null;

async function applyToken(token: string | null) {
  currentToken = token;
  try {
    await supabase.realtime.setAuth(token);
  } catch {
    // A failed re-auth leaves channels on the old token until the next change;
    // the server rejects an expired one and the screen falls back to fetching.
  }
}

/** Idempotent: loads the stored token once and follows every later change. */
export function ensureRealtimeAuth(): Promise<void> {
  if (!authReady) {
    authReady = (async () => {
      await applyToken(await AsyncStorage.getItem('auth_token'));
      AuthService.onTokenChange((token) => {
        void applyToken(token);
        // Signed out: nothing private may stay open.
        if (!token) closeAll();
      });
    })();
  }
  return authReady;
}

export const hasRealtimeAuth = () => !!currentToken;

function closeAll() {
  for (const [topic, entry] of entries) {
    void supabase.removeChannel(entry.channel);
    entries.delete(topic);
  }
}

/**
 * Every binding — broadcast events and presence — is registered BEFORE the
 * channel joins: realtime-js does not reliably deliver callbacks added after
 * `subscribe()`, and a channel may only be subscribed once.
 */
async function acquire(topic: string, events: string[], options: { presenceKey?: string } = {}): Promise<Entry | null> {
  await ensureRealtimeAuth();
  if (!currentToken) return null;

  let entry = entries.get(topic);
  if (!entry) {
    const channel = supabase.channel(topic, {
      config: {
        private: true,
        broadcast: { self: false },
        ...(options.presenceKey ? { presence: { key: options.presenceKey } } : {}),
      },
    });
    const created: Entry = {
      channel,
      refs: 0,
      listeners: new Map(),
      presenceListeners: new Set(),
      joined: false,
      onJoined: new Set(),
    };
    for (const event of events) {
      created.listeners.set(event, new Set());
      channel.on('broadcast', { event }, (message) => {
        for (const listener of created.listeners.get(event) ?? []) listener(message?.payload);
      });
    }
    if (topic.startsWith('presence:')) {
      const notify = () => created.presenceListeners.forEach((fn) => fn());
      channel.on('presence', { event: 'sync' }, notify);
      channel.on('presence', { event: 'join' }, notify);
      channel.on('presence', { event: 'leave' }, notify);
    }
    entries.set(topic, created);
    entry = created;
    channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED') return;
      created.joined = true;
      created.onJoined.forEach((fn) => fn());
      created.onJoined.clear();
    });
  }
  entry.refs += 1;
  return entry;
}

/** Run once the channel has joined — immediately if it already has. */
function whenJoined(entry: Entry, fn: () => void) {
  if (entry.joined) fn();
  else entry.onJoined.add(fn);
}

function release(topic: string) {
  const entry = entries.get(topic);
  if (!entry) return;
  entry.refs -= 1;
  if (entry.refs <= 0) {
    void supabase.removeChannel(entry.channel);
    entries.delete(topic);
  }
}

function listen(entry: Entry, event: string, listener: Listener): () => void {
  const set = entry.listeners.get(event);
  set?.add(listener);
  return () => set?.delete(listener);
}

/** One conversation's server events. Returns an unsubscribe. */
export function subscribeConversation(
  conversationId: string,
  handlers: {
    onMessage?: (event: RealtimeMessageEvent) => void;
    onReceipt?: (event: RealtimeReceiptEvent) => void;
    onRemoved?: (event: { id: string; conversation_id: string }) => void;
  },
): () => void {
  const topic = `conversation:${conversationId}`;
  let stopped = false;
  let held = false;
  const offs: (() => void)[] = [];

  void acquire(topic, ['message', 'receipt', 'message_removed']).then((entry) => {
    if (!entry) return;
    if (stopped) return release(topic);
    held = true;
    if (handlers.onMessage) offs.push(listen(entry, 'message', handlers.onMessage));
    if (handlers.onReceipt) offs.push(listen(entry, 'receipt', handlers.onReceipt));
    if (handlers.onRemoved) offs.push(listen(entry, 'message_removed', handlers.onRemoved));
  });

  return () => {
    if (stopped) return;
    stopped = true;
    offs.forEach((off) => off());
    if (held) release(topic);
  };
}

/** Typing on one conversation: listen, and send your own (throttle upstream). */
export function subscribeTyping(conversationId: string, myId: string, onTyping: (userId: string) => void) {
  const topic = `typing:${conversationId}`;
  let entry: Entry | null = null;
  let stopped = false;
  let off: (() => void) | null = null;

  void acquire(topic, ['typing']).then((acquired) => {
    if (!acquired) return;
    if (stopped) return release(topic);
    entry = acquired;
    off = listen(acquired, 'typing', (payload) => {
      if (payload?.user_id && payload.user_id !== myId) onTyping(payload.user_id);
    });
  });

  return {
    send() {
      void entry?.channel.send({ type: 'broadcast', event: 'typing', payload: { user_id: myId } });
    },
    unsubscribe() {
      if (stopped) return;
      stopped = true;
      off?.();
      if (entry) release(topic);
    },
  };
}

/** `inbox` events for the signed-in user — keeps the badge and the inbox live. */
export function subscribeUser(userId: string, onInbox: (event: { conversation_id: string; message_id: string; sender_id: string; created_at: string }) => void): () => void {
  const topic = `user:${userId}`;
  let stopped = false;
  let off: (() => void) | null = null;

  void acquire(topic, ['inbox']).then((entry) => {
    if (!entry) return;
    if (stopped) return release(topic);
    off = listen(entry, 'inbox', onInbox);
  });

  return () => {
    if (stopped) return;
    stopped = true;
    if (off) {
      off();
      release(topic);
    }
  };
}

/**
 * Watch whether one person is online. A viewer the policy does not admit
 * (not a friend, activity hidden, a block either way) simply never sees them
 * online — the join is refused server-side, which reads the same as offline.
 */
export function watchPresence(userId: string, onChange: (online: boolean) => void): () => void {
  const topic = `presence:${userId}`;
  let stopped = false;
  let entry: Entry | null = null;
  let update: (() => void) | null = null;

  void acquire(topic, []).then((acquired) => {
    if (!acquired) return;
    if (stopped) return release(topic);
    entry = acquired;
    update = () => onChange(Object.keys(acquired.channel.presenceState()).includes(userId));
    acquired.presenceListeners.add(update);
    whenJoined(acquired, update);
  });

  return () => {
    if (stopped) return;
    stopped = true;
    if (entry && update) entry.presenceListeners.delete(update);
    if (entry) release(topic);
  };
}

let ownPresence: { userId: string; entry: Entry } | null = null;

/**
 * Broadcast that the signed-in user is online. The server refuses the track
 * when `show_activity` is off, so turning it off in Edit profile takes effect
 * even before this device hears about it.
 */
export async function trackOwnPresence(userId: string): Promise<void> {
  if (ownPresence?.userId === userId) {
    void ownPresence.entry.channel.track({ online_at: new Date().toISOString() });
    return;
  }
  await untrackOwnPresence();
  const topic = `presence:${userId}`;
  const entry = await acquire(topic, [], { presenceKey: userId });
  if (!entry) return;
  ownPresence = { userId, entry };
  whenJoined(entry, () => {
    void entry.channel.track({ online_at: new Date().toISOString() });
  });
}

export async function untrackOwnPresence(): Promise<void> {
  if (!ownPresence) return;
  const { userId, entry } = ownPresence;
  ownPresence = null;
  try {
    await entry.channel.untrack();
  } catch {
    // Leaving the channel ends presence anyway.
  }
  release(`presence:${userId}`);
}
