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
  MessageReactions,
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
export function mergeMessages(existing: readonly ChatMessage[], incoming: readonly ChatMessage[], now: number = Date.now()): ChatMessage[] {
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
    byId.set(message.id, previous ? richer(previous, message, now) : message);
  };

  for (const m of existing) put(m);
  for (const m of incoming) put(m);
  return withRetractedQuotes([...byId.values()]).sort(compareNewestFirst);
}

/**
 * A quote must never outlive the message it quotes. Any reply whose original
 * is in the list as removed or unsent shows "unavailable" instead of its text —
 * whichever way the tombstone arrived (an event, a fetch), and however stale
 * the reply's own copy is.
 */
function withRetractedQuotes(messages: ChatMessage[], alsoGone: ReadonlySet<string> = new Set()): ChatMessage[] {
  const gone = new Set(alsoGone);
  for (const m of messages) if (isGone(m)) gone.add(m.id);
  if (!gone.size) return messages;
  return messages.map((m) =>
    m.reply_to && m.reply_to.status === 'visible' && gone.has(m.reply_to.id)
      ? { ...m, reply_to: { ...m.reply_to, status: 'unavailable' as const, body: null } }
      : m,
  );
}

/**
 * A thread when it is (re)opened or the app returns: the server's newest page
 * and the messages still being sent, and nothing else. Older cached pages are
 * dropped, because realtime only runs while the thread is open: a message
 * unsent or removed meanwhile, further back than the newest page, would
 * otherwise stay readable from the cache. They are fetched again on scroll.
 */
export function freshPage(
  existing: readonly ChatMessage[],
  page: readonly ChatMessage[],
  heldBefore: ReadonlySet<string> = new Set(existing.map((m) => m.id)),
  now: number = Date.now(),
): ChatMessage[] {
  const onPage = new Set(page.map((m) => m.id));
  // Kept: messages still sending, the cached copies of this very page (their
  // live signed URLs survive the merge), and anything that arrived while the
  // page was being fetched (`heldBefore` is what was held when the request
  // started). Dropped: the older pages held before.
  return mergeMessages(existing.filter((m) => isLocal(m) || onPage.has(m.id) || !heldBefore.has(m.id)), page, now);
}

/** A full-screen photo or video stays open only while its message is still visible in the thread. */
export function viewerStillAllowed(messages: readonly ChatMessage[], messageId: string): boolean {
  return messages.some((m) => m.id === messageId && m.status === 'visible');
}

/**
 * A message was removed by a moderator or unsent by its sender: its bubble
 * becomes a tombstone, and every reply that quoted it loses the quoted text —
 * also when the message itself is not loaded (it sits on an older page), which
 * is the usual case for a quote.
 */
export function retract(messages: readonly ChatMessage[], id: string, status: 'removed' | 'unsent'): ChatMessage[] {
  return withRetractedQuotes(
    messages.map((m) =>
      m.id === id
        ? { ...m, status, body: null, attachments: [], embed: null, reply_to: null, reactions: { counts: [], mine: null } }
        : m,
    ),
    new Set([id]),
  );
}

/**
 * The last word on any list of messages, whatever built it — a page, a merge,
 * an event, a rollback. What this device has heard on the channel (`gone`) or
 * done itself (`hidden`, "delete for me") is applied again, so no path can
 * show what was taken back: not a page fetched a moment before the unsend, not
 * an event that arrived before its message was loaded.
 *
 * A removal outranks an unsend. Returns the same array when there is nothing
 * to enforce.
 */
export function enforceRetractions(
  messages: ChatMessage[],
  gone: ReadonlyMap<string, 'removed' | 'unsent'>,
  hidden: ReadonlySet<string>,
): ChatMessage[] {
  if (!gone.size && !hidden.size) return messages;
  const list = messages
    .filter((m) => !hidden.has(m.id))
    .map((m) => {
      const status = gone.get(m.id);
      if (!status || m.status === 'removed' || m.status === status) return m;
      return { ...m, status, body: null, attachments: [], embed: null, reply_to: null, reactions: { counts: [], mine: null } };
    });
  return withRetractedQuotes(list, new Set([...gone.keys(), ...hidden]));
}

/**
 * The server refused an unsend: put back what `retract` took, from the list as
 * it was before — unless the message was removed (or really unsent) in the
 * meantime, in which case nothing comes back.
 */
export function undoRetract(current: readonly ChatMessage[], before: readonly ChatMessage[], id: string): ChatMessage[] {
  const was = new Map(before.map((m) => [m.id, m]));
  const original = was.get(id);
  const now = current.find((m) => m.id === id);
  // Only our own optimistic tombstone is undone.
  if (!original || !now || now.status !== 'unsent' || original.status !== 'visible') return [...current];
  return current.map((m) => {
    if (m.id === id) return original;
    const old = was.get(m.id);
    return old?.reply_to?.id === id && m.reply_to?.id === id ? { ...m, reply_to: old.reply_to } : m;
  });
}

/**
 * The server refused a "delete for me": the message and my quotes of it come
 * back as they were. While it was out of the list an unsend or a removal could
 * not be applied to it, so the caller passes what it heard meanwhile
 * (`goneAs`), and the message then comes back as that tombstone.
 */
export function undoDrop(
  current: readonly ChatMessage[],
  before: readonly ChatMessage[],
  id: string,
  goneAs: 'removed' | 'unsent' | null = null,
): ChatMessage[] {
  const was = new Map(before.map((m) => [m.id, m]));
  const original = was.get(id);
  if (!original || current.some((m) => m.id === id)) return [...current];
  const restored = current.map((m) => {
    const old = was.get(m.id);
    return original.status === 'visible' && old?.reply_to?.id === id && m.reply_to?.id === id ? { ...m, reply_to: old.reply_to } : m;
  });
  const list = [...restored, original].sort(compareNewestFirst);
  return goneAs ? retract(list, id, goneAs) : list;
}

/**
 * A take-back (unsend, delete for me) whose request got no answer, or failed
 * inside the server, may still have gone through: only a refusal is certain.
 * The bubble is put back so nothing looks taken back that might not be, and
 * the thread is read again from the server, which settles it either way.
 */
export const outcomeUnknown = (status: number | null): boolean => status === null || status >= 500;

/** How far down the newest-first list a message can sit and still be on the server's newest page (30). */
const NEWEST_PAGE_REACH = 20;

/**
 * What to do once a take-back has failed and the bubble is back.
 *
 * `reread`: read the newest page again — only when the outcome is unknown (or
 * the server says an unsent message is already gone, `goneOn404`) and the
 * message is recent enough for that page to answer. For one further back a
 * fresh read would throw the loaded history away and settle nothing.
 *
 * `code`: the error to show. No answer at all is `not_confirmed`, not the
 * connection notice the thread keeps quiet about.
 */
export function takeBackFollowUp(
  messages: readonly ChatMessage[],
  id: string,
  status: number | null,
  code: string,
  { goneOn404 = false }: { goneOn404?: boolean } = {},
): { reread: boolean; code: string } {
  const at = messages.findIndex((m) => m.id === id);
  const unsettled = outcomeUnknown(status) || (goneOn404 && status === 404);
  return { reread: unsettled && at > -1 && at < NEWEST_PAGE_REACH, code: status === null ? 'not_confirmed' : code };
}

/** "Delete for me": the message leaves this thread, and so does its text in my quotes of it. */
export function dropForMe(messages: readonly ChatMessage[], id: string): ChatMessage[] {
  return withRetractedQuotes(messages.filter((m) => m.id !== id), new Set([id]));
}

/** A signed URL this close to expiry is swapped for a fresher one. */
const URL_REFRESH_MARGIN_MS = 60_000;

const isGone = (m: ChatMessage) => m.status === 'removed' || m.status === 'unsent';

/** A quote that is unavailable in either copy is unavailable: its text never comes back. */
function foldQuote(a: ChatMessage['reply_to'], b: ChatMessage['reply_to']): ChatMessage['reply_to'] {
  const lost = [a, b].find((q) => q && q.status !== 'visible');
  if (lost) return { ...lost, status: 'unavailable', body: null };
  return b ?? a;
}

/**
 * Two copies of one message, folded: `a` is the one already held, `b` the one
 * arriving.
 *
 *   - A removal, and then an unsend, always wins. Both are final, so a cached
 *     or late copy can never bring the content back.
 *   - Otherwise the arriving copy is the truth, whatever the held one has more
 *     of: a photo or a card the server no longer sends is gone.
 *   - The one exception is a copy built from a realtime event, which carries
 *     only the text: it never replaces a copy fetched from the API.
 *   - A quote that either copy marks unavailable stays unavailable.
 *   - Receipts only move forward. A signed URL still good for a minute is
 *     kept, so a refetch does not restart a playing voice note.
 */
function richer(a: ChatMessage, b: ChatMessage, now: number): ChatMessage {
  const status = a.status === 'removed' || b.status === 'removed' ? 'removed' : isGone(a) ? a.status : isGone(b) ? b.status : null;
  if (status) {
    const base = isGone(b) ? b : a;
    return {
      ...base,
      status,
      body: null,
      attachments: [],
      embed: null,
      reply_to: null,
      reactions: { counts: [], mine: null },
      receipt: maxReceipt(a.receipt, b.receipt),
    };
  }
  const base = b.from_event && !a.from_event ? a : b;
  const other = base === b ? a : b;
  // The copy already on screen (`a`) keeps its URL while it is still good.
  const live = new Map(
    a.attachments
      .filter((x) => x.url && Date.parse(x.url_expires_at ?? '') - now > URL_REFRESH_MARGIN_MS)
      .map((x) => [x.id, x]),
  );
  return {
    ...base,
    attachments: base.attachments.map((x) => {
      const held = live.get(x.id);
      return held ? { ...x, url: held.url, url_expires_at: held.url_expires_at } : x;
    }),
    reply_to: base === b ? foldQuote(a.reply_to, b.reply_to) : a.reply_to,
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
    reply_to: null,
    reactions: { counts: [], mine: null },
    from_event: true,
  };
}

/** Media and shares need signed URLs; a reply needs its quote. */
export const needsFetch = (event: Pick<RealtimeMessageEvent, 'kind' | 'reply_to_id'>): boolean =>
  event.kind !== 'text' || !!event.reply_to_id;

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

/**
 * Active this recently counts as online in the friends list (C3). Longer than
 * the five minutes between the server's last-seen stamps
 * (profileService LAST_SEEN_THROTTLE_SEC), so a friend who is active the whole
 * time never drops out between two stamps.
 */
export const ONLINE_WINDOW_MS = 10 * 60_000;

/**
 * The friends list's Online section: friends the presence channel shows live
 * (`live`), then friends active in the last few minutes, most recent first;
 * everyone else keeps the list's own order. Someone who hides their activity
 * has no `last_active_at`, no presence channel, and is never listed as online.
 */
export function splitOnline<T extends { id: string; last_active_at: string | null }>(
  friends: readonly T[],
  now: number,
  live: ReadonlySet<string> = new Set(),
): { online: T[]; rest: T[] } {
  const at = (x: T) => Date.parse(x.last_active_at ?? '');
  const recent = (x: T) => Number.isFinite(at(x)) && now - at(x) <= ONLINE_WINDOW_MS;
  const isOnline = (x: T) => live.has(x.id) || recent(x);
  return {
    online: friends
      .filter(isOnline)
      .sort((a, b) => Number(live.has(b.id)) - Number(live.has(a.id)) || (at(b) || 0) - (at(a) || 0)),
    rest: friends.filter((x) => !isOnline(x)),
  };
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

// ---------------------------------------------------------------- C2: voice, video, reactions, replies

/** conversationRules.REACTIONS — the server refuses anything else. */
export const REACTIONS = ['❤️', '😂', '😮', '😢', '🔥', '👍'] as const;

/** conversationRules.ATTACHMENT_LIMITS. */
export const RECORD_MAX_MS = 120_000;
export const RECORD_MIN_MS = 1000;
export const VIDEO_MAX_MS = 60_000;
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
/** How far a held mic button slides toward the start edge to cancel. */
export const SLIDE_CANCEL_PX = 80;

/** 7 400 ms → "0:07". */
export function formatDuration(ms: number): string {
  const total = Number.isFinite(ms) && ms > 0 ? Math.floor(ms / 1000) : 0;
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Voice playback speed: 1× → 1.5× → 2× → 1×. */
export function nextRate(rate: number): number {
  return rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1;
}

/** What happens when the mic button is let go. */
export function recordingOutcome(durationMs: number, cancelled: boolean): 'cancel' | 'too_short' | 'preview' {
  if (cancelled) return 'cancel';
  if (!(durationMs >= RECORD_MIN_MS)) return 'too_short';
  return 'preview';
}

/** Sliding toward the start edge cancels: left in a left-to-right layout, right in Arabic. */
export function isCancelGesture(dx: number, rtl: boolean): boolean {
  return rtl ? dx > SLIDE_CANCEL_PX : dx < -SLIDE_CANCEL_PX;
}

/**
 * The reactions after the viewer picks `emoji` (null takes theirs back). The
 * same emoji again also takes it back. Optimistic; the server's answer wins.
 */
export function applyReaction(current: MessageReactions, emoji: string | null): MessageReactions {
  const next = emoji !== null && emoji === current.mine ? null : emoji;
  const counts = new Map(current.counts.map((c) => [c.emoji, c.count]));
  if (current.mine) {
    const left = (counts.get(current.mine) ?? 1) - 1;
    if (left > 0) counts.set(current.mine, left);
    else counts.delete(current.mine);
  }
  if (next) counts.set(next, (counts.get(next) ?? 0) + 1);
  return { counts: [...counts].map(([e, count]) => ({ emoji: e, count })), mine: next };
}

export type MessageActionKey = 'react' | 'reply' | 'copy' | 'hide' | 'unsend' | 'report';

/** The long-press menu, in order. A message still sending has only Copy. */
export function messageActions(message: ChatMessage, myId: string): MessageActionKey[] {
  const local = isLocal(message);
  const visible = message.status === 'visible';
  const mine = message.sender_id === myId;
  const out: MessageActionKey[] = [];
  if (visible && !local) out.push('react', 'reply');
  if (visible && message.body) out.push('copy');
  if (local) return out;
  out.push('hide');
  if (visible && mine) out.push('unsend');
  // Theirs can be reported even once unsent: the server kept it for review.
  if (!mine && message.status !== 'removed') out.push('report');
  return out;
}

/** The tombstone's translation key. */
export function unsentCopy(message: Pick<ChatMessage, 'sender_id'>, myId: string): string {
  return message.sender_id === myId ? 'social.thread.unsentByYou' : 'social.thread.unsent';
}

/** Why a picked video cannot be sent, or null. */
export function videoPickProblem(asset: { durationMs?: number | null; fileSize?: number | null }): 'video_too_long' | 'video_too_large' | null {
  if ((asset.durationMs ?? 0) > VIDEO_MAX_MS + 500) return 'video_too_long';
  if ((asset.fileSize ?? 0) > VIDEO_MAX_BYTES) return 'video_too_large';
  return null;
}

/**
 * Whether the chat composer can take another photo, from the gallery or the
 * camera: up to `max`, never beside a video, which travels on its own.
 */
export function canAddPhotos({ photoCount, hasVideo, max }: { photoCount: number; hasVideo: boolean; max: number }): boolean {
  return !hasVideo && photoCount < max;
}

/**
 * The friends whose presence to watch: the most recently active ones that
 * share their activity, at most `max`. Each watched friend is one realtime
 * channel, and a connection has a limited number (hooks/social/usePresence.ts).
 */
export function presenceWatchList(
  friends: { id: string; last_active_at: string | null }[],
  max: number,
): string[] {
  return friends
    .filter((f) => f.last_active_at)
    .sort((a, b) => b.last_active_at!.localeCompare(a.last_active_at!))
    .slice(0, max)
    .map((f) => f.id);
}
