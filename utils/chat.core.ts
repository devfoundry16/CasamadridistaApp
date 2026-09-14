/**
 * The pure half of direct messaging: merging optimistic, fetched and realtime
 * messages; receipts; bubble clustering; typing and presence timing; and which
 * shape the relationship control takes.
 *
 * Type-only imports, so `utils/__tests__/chat.test.mts` can load it under
 * `node --test` — the same split as `session.core.ts` and `watchTime.core.ts`.
 */
import type {
  ChatMessage,
  ReceiptState,
  RealtimeMessageEvent,
  RelationshipState,
} from '../types/social';

// ============================================================
// Identity
// ============================================================

/** Messages written on this device before the server has answered. */
export const LOCAL_PREFIX = 'local:';

/**
 * A client id: generated before the send, so a retry after a dropped
 * connection is recognised by the server (`uq_messages_client`) instead of
 * posting twice. Matches the backend's `^[A-Za-z0-9_-]{8,64}$`.
 */
export function newClientId(now: number, random: string): string {
  const tail = random.replace(/[^A-Za-z0-9]/g, '').slice(0, 16) || '0000';
  return `c_${now.toString(36)}_${tail}`;
}

export const isLocal = (message: Pick<ChatMessage, 'id'>): boolean => message.id.startsWith(LOCAL_PREFIX);

// ============================================================
// Ordering and merging
// ============================================================

/** Newest first — the order an inverted list renders from the bottom up. */
export function compareNewestFirst(a: ChatMessage, b: ChatMessage): number {
  const at = Date.parse(a.created_at);
  const bt = Date.parse(b.created_at);
  if (at !== bt) return bt - at;
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

/**
 * Merge messages from any source into one newest-first list with no duplicates.
 *
 *   - the same server id twice (a fetch racing a broadcast) keeps one, and
 *     prefers the richer copy: a fetched message has signed photo URLs and a
 *     resolved embed that a broadcast never carries;
 *   - an optimistic message is replaced by the server's copy with the same
 *     `client_id`, keeping its local photo preview until the signed URL loads.
 */
export function mergeMessages(existing: readonly ChatMessage[], incoming: readonly ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  const localByClient = new Map<string, string>();

  const put = (message: ChatMessage) => {
    if (isLocal(message)) {
      if (message.client_id) {
        // A server copy already landed: the optimistic one is obsolete.
        const settled = [...byId.values()].some((m) => !isLocal(m) && m.client_id === message.client_id);
        if (settled) return;
        localByClient.set(message.client_id, message.id);
      }
      byId.set(message.id, message);
      return;
    }

    if (message.client_id && localByClient.has(message.client_id)) {
      const localId = localByClient.get(message.client_id)!;
      const local = byId.get(localId);
      byId.delete(localId);
      localByClient.delete(message.client_id);
      message = withLocalPreviews(message, local);
    }

    const previous = byId.get(message.id);
    byId.set(message.id, previous ? richer(previous, message) : message);
  };

  for (const m of existing) put(m);
  for (const m of incoming) put(m);
  return [...byId.values()].sort(compareNewestFirst);
}

function richer(a: ChatMessage, b: ChatMessage): ChatMessage {
  const score = (m: ChatMessage) =>
    (m.embed ? 2 : 0) + m.attachments.filter((x) => x.url).length + (m.status === 'removed' ? 10 : 0);
  const base = score(b) >= score(a) ? b : a;
  const other = base === b ? a : b;
  // A removal always wins, and receipts only ever move forward.
  return {
    ...base,
    status: a.status === 'removed' || b.status === 'removed' ? 'removed' : base.status,
    body: a.status === 'removed' || b.status === 'removed' ? null : base.body,
    receipt: maxReceipt(base.receipt, other.receipt),
  };
}

function withLocalPreviews(server: ChatMessage, local: ChatMessage | undefined): ChatMessage {
  if (!local?.attachments.length) return server;
  return {
    ...server,
    attachments: server.attachments.map((a, i) => ({ ...a, local_uri: local.attachments[i]?.local_uri })),
  };
}

// ============================================================
// Receipts
// ============================================================

const RECEIPT_ORDER: ReceiptState[] = ['failed', 'pending', 'sent', 'delivered', 'seen'];

export function maxReceipt(a: ReceiptState | null, b: ReceiptState | null): ReceiptState | null {
  if (!a) return b;
  if (!b) return a;
  // A server receipt supersedes a device-only failure or pending state.
  return RECEIPT_ORDER.indexOf(a) >= RECEIPT_ORDER.indexOf(b) ? a : b;
}

/** The backend's `conversationRules.receiptFor`, mirrored. */
export function receiptFor(
  createdAt: string,
  marks: { last_delivered_at: string | null; last_read_at: string | null },
): 'sent' | 'delivered' | 'seen' {
  const at = Date.parse(createdAt);
  if (!Number.isFinite(at)) return 'sent';
  const read = Date.parse(marks.last_read_at ?? '');
  if (Number.isFinite(read) && read >= at) return 'seen';
  const delivered = Date.parse(marks.last_delivered_at ?? '');
  if (Number.isFinite(delivered) && delivered >= at) return 'delivered';
  return 'sent';
}

/**
 * Apply the other person's new receipt marks to my messages. Only moves a
 * receipt forward, and never touches a message still pending on the device.
 */
export function applyReceipts(
  messages: readonly ChatMessage[],
  myId: string,
  marks: { last_delivered_at: string | null; last_read_at: string | null },
): ChatMessage[] {
  let changed = false;
  const next = messages.map((m) => {
    if (m.sender_id !== myId || isLocal(m)) return m;
    const receipt = maxReceipt(m.receipt, receiptFor(m.created_at, marks));
    if (receipt === m.receipt) return m;
    changed = true;
    return { ...m, receipt };
  });
  return changed ? next : (messages as ChatMessage[]);
}

/** The newest message someone else sent — what a read acknowledgement points at. */
export function newestFromOthers(messages: readonly ChatMessage[], myId: string): ChatMessage | null {
  for (const m of messages) if (m.sender_id !== myId && !isLocal(m)) return m;
  return null;
}

// ============================================================
// Realtime
// ============================================================

/**
 * A broadcast becomes a renderable message only for text: photos need signed
 * URLs and shares need an access-checked embed, so those are fetched through
 * the API instead (`needsFetch`).
 */
export function messageFromEvent(event: RealtimeMessageEvent, myId: string): ChatMessage | null {
  if (!event?.id || !event.conversation_id || !event.sender_id || !event.created_at) return null;
  if (event.kind !== 'text') return null;
  return {
    id: event.id,
    conversation_id: event.conversation_id,
    sender_id: event.sender_id,
    kind: 'text',
    body: event.body ?? null,
    status: 'visible',
    client_id: event.sender_id === myId ? event.client_id : null,
    created_at: event.created_at,
    attachments: [],
    embed: null,
    receipt: event.sender_id === myId ? 'sent' : null,
  };
}

export const needsFetch = (event: Pick<RealtimeMessageEvent, 'kind'>): boolean => event.kind !== 'text';

// ============================================================
// Layout
// ============================================================

const CLUSTER_MS = 3 * 60 * 1000;

export interface BubbleLayout {
  mine: boolean;
  /** Joined to the message above it (older). */
  joinsPrevious: boolean;
  /** Joined to the message below it (newer). */
  joinsNext: boolean;
  /** Draw a day separator above this message. */
  startsDay: boolean;
}

const dayKey = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/**
 * Where a message sits in its cluster. `messages` is newest first, so index+1
 * is the OLDER neighbour and index-1 the NEWER one.
 */
export function bubbleLayout(messages: readonly ChatMessage[], index: number, myId: string): BubbleLayout {
  const m = messages[index];
  const older = messages[index + 1];
  const newer = messages[index - 1];
  const joins = (a?: ChatMessage, b?: ChatMessage) =>
    !!a &&
    !!b &&
    a.sender_id === b.sender_id &&
    dayKey(a.created_at) === dayKey(b.created_at) &&
    Math.abs(Date.parse(a.created_at) - Date.parse(b.created_at)) <= CLUSTER_MS;

  return {
    mine: m.sender_id === myId,
    joinsPrevious: joins(m, older),
    joinsNext: joins(m, newer),
    startsDay: !older || dayKey(older.created_at) !== dayKey(m.created_at),
  };
}

/**
 * Bubble corner radii as LOGICAL corners (start/end), which React Native flips
 * under RTL by itself — so the tail sits on the trailing side for my messages
 * and the leading side for theirs in both English and Arabic, with no
 * `I18nManager.isRTL` branch to get wrong.
 *
 * The tail corner is 4pt; a corner that joins a neighbour in the same cluster
 * is 6pt so a run reads as one block.
 */
export function bubbleRadii(layout: Pick<BubbleLayout, 'mine' | 'joinsPrevious' | 'joinsNext'>) {
  const R = 16;
  const TAIL = 4;
  const JOIN = 6;
  const sideTop = layout.joinsPrevious ? JOIN : R;
  const sideBottom = layout.joinsNext ? JOIN : TAIL;
  return layout.mine
    ? { borderTopStartRadius: R, borderBottomStartRadius: R, borderTopEndRadius: sideTop, borderBottomEndRadius: sideBottom }
    : { borderTopEndRadius: R, borderBottomEndRadius: R, borderTopStartRadius: sideTop, borderBottomStartRadius: sideBottom };
}

// ============================================================
// Typing and presence
// ============================================================

export const TYPING_SEND_EVERY_MS = 2500;
export const TYPING_SHOW_FOR_MS = 4500;

export const shouldSendTyping = (lastSentAt: number | null, now: number): boolean =>
  lastSentAt === null || now - lastSentAt >= TYPING_SEND_EVERY_MS;

export const isTyping = (lastHeardAt: number | null, now: number): boolean =>
  lastHeardAt !== null && now - lastHeardAt < TYPING_SHOW_FOR_MS;

export type PresenceLabel =
  | { key: 'online' }
  | { key: 'activeMinutes' | 'activeHours' | 'activeDays'; value: number }
  | null;

/**
 * "Online" beats any timestamp. Past a week, "last active" stops being useful
 * and is not shown at all.
 */
export function presenceLabel(online: boolean, lastActiveAt: string | null, now: number): PresenceLabel {
  if (online) return { key: 'online' };
  const at = Date.parse(lastActiveAt ?? '');
  if (!Number.isFinite(at)) return null;
  const minutes = Math.max(1, Math.round((now - at) / 60_000));
  if (minutes < 60) return { key: 'activeMinutes', value: minutes };
  const hours = Math.round(minutes / 60);
  if (hours < 24) return { key: 'activeHours', value: hours };
  const days = Math.round(hours / 24);
  return days <= 7 ? { key: 'activeDays', value: days } : null;
}

// ============================================================
// The relationship control
// ============================================================

/**
 * The control changes SHAPE, not just label (design plan):
 *
 *   add       solid gold "Add friend"
 *   requested muted outline "Requested", with a cancel affordance
 *   respond   splits in two: gold Accept, outline Decline
 *   friends   quiet outline "Friends ✓" that opens Message / Remove / Block
 *   blocking  destructive outline "Blocked" that unblocks
 *   self      "Edit profile"
 */
export type ControlShape = 'add' | 'requested' | 'respond' | 'friends' | 'blocking' | 'self';

export function controlShape(state: RelationshipState): ControlShape {
  switch (state) {
    case 'self':
      return 'self';
    case 'blocking':
      return 'blocking';
    case 'friends':
      return 'friends';
    case 'request_sent':
      return 'requested';
    case 'request_received':
      return 'respond';
    default:
      return 'add';
  }
}

/** The state an action leads to, for an optimistic update. The server's answer replaces it. */
export function optimisticState(state: RelationshipState, action: string): RelationshipState {
  switch (action) {
    case 'request':
      return 'request_sent';
    case 'accept':
      return 'friends';
    case 'cancel':
    case 'decline':
    case 'remove':
    case 'unblock':
      return 'none';
    case 'block':
      return 'blocking';
    default:
      return state;
  }
}

export const badgeText = (count: number): string | null => (count <= 0 ? null : count > 9 ? '9+' : String(count));
