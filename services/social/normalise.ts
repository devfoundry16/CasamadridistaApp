/**
 * Casa Social wire → internal shape, once, at the service boundary.
 *
 * Pure, with **type-only** imports: `utils/__tests__/socialContract.test.mts`
 * loads this file under `node --test`, which cannot resolve a runtime import
 * without a `.ts` extension. The vocabularies it needs are therefore inlined
 * here and pinned against `types/social.ts` by that test.
 *
 * Everything is defensive: a missing or malformed field becomes a safe default
 * rather than a crash in a list row. The server is still the authority — nothing
 * here decides what a viewer may see.
 */
import type {
  ChatMessage,
  ConversationHeader,
  ConversationSummary,
  EmbedKind,
  FriendRequests,
  FriendsPage,
  InboxPage,
  MessageAttachment,
  MessageEmbed,
  MessageKind,
  MessagesPage,
  PersonCard,
  ProfileUser,
  ReceiptState,
  RelationshipState,
  SearchResult,
  ShareResult,
  SocialProfile,
  SuggestedPerson,
  UnreadCounts,
  UsernameCheck,
} from '../../types/social';

const RELATIONSHIPS: readonly string[] = ['self', 'blocking', 'friends', 'request_sent', 'request_received', 'none'];
const KINDS: readonly string[] = ['text', 'image', 'share'];
const EMBEDS: readonly string[] = ['post', 'media_item', 'profile'];
const RECEIPTS: readonly string[] = ['sent', 'delivered', 'seen'];

export const INLINED_VOCABULARIES = { RELATIONSHIPS, KINDS, EMBEDS, RECEIPTS };

type Wire = Record<string, any>;

const str = (v: unknown): string | null => (typeof v === 'string' && v.length ? v : null);
const num = (v: unknown, fallback = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const bool = (v: unknown): boolean => v === true;
const list = (v: unknown): Wire[] => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object') : []);

export function normaliseRelationship(value: unknown): RelationshipState {
  // `blocked` is never sent, but if it ever were, the safe reading is "none":
  // the control offers nothing that reveals a block.
  return (RELATIONSHIPS.includes(value as string) ? value : 'none') as RelationshipState;
}

export function normalisePerson(raw: unknown): PersonCard | null {
  if (!raw || typeof raw !== 'object') return null;
  const w = raw as Wire;
  const id = str(w.id);
  if (!id) return null;
  const username = str(w.username);
  return {
    id,
    username,
    name: str(w.name) ?? username ?? '',
    avatar_url: str(w.avatar_url),
    country_code: str(w.country_code),
    is_member: bool(w.is_member),
    is_verified: bool(w.is_verified),
  };
}

function people<T extends object>(raw: unknown, extra: (w: Wire) => T): (PersonCard & T)[] {
  return list(raw)
    .map((w) => {
      const person = normalisePerson(w);
      return person ? { ...person, ...extra(w) } : null;
    })
    .filter((p): p is PersonCard & T => p !== null);
}

export function normaliseProfile(raw: unknown): SocialProfile | null {
  const w = (raw ?? {}) as Wire;
  const person = normalisePerson(w.user);
  if (!person) return null;
  const u = w.user as Wire;
  const user: ProfileUser = {
    ...person,
    bio: str(u.bio),
    joined_at: str(u.joined_at),
    last_active_at: str(u.last_active_at),
    ...('show_activity' in u ? { show_activity: u.show_activity !== false } : {}),
    ...('display_name' in u ? { display_name: str(u.display_name) } : {}),
    ...('fan_club_id' in u ? { fan_club_id: str(u.fan_club_id) } : {}),
  };
  const stats = (w.stats ?? {}) as Wire;
  const rel = (w.relationship ?? {}) as Wire;
  return {
    user,
    stats: {
      posts: num(stats.posts),
      friends: num(stats.friends),
      joined_year: typeof stats.joined_year === 'number' ? stats.joined_year : null,
    },
    relationship: {
      state: normaliseRelationship(rel.state),
      can_message: bool(rel.can_message),
    },
  };
}

export function normaliseSearch(raw: unknown): SearchResult[] {
  return people((raw as Wire)?.users, (w) => ({ relationship: normaliseRelationship(w.relationship) }));
}

export function normaliseSuggestions(raw: unknown): SuggestedPerson[] {
  return people((raw as Wire)?.users, (w) => ({
    reason: (['mutual', 'fan_club', 'country'].includes(w.reason) ? w.reason : 'country') as SuggestedPerson['reason'],
    mutual_count: num(w.mutual_count),
  }));
}

export function normaliseFriends(raw: unknown): FriendsPage {
  const w = (raw ?? {}) as Wire;
  return {
    friends: people(w.friends, (f) => ({ friends_since: str(f.friends_since) })),
    next_before: str(w.next_before),
  };
}

export function normaliseRequests(raw: unknown): FriendRequests {
  const w = (raw ?? {}) as Wire;
  const at = (r: Wire) => ({ requested_at: str(r.requested_at) });
  return { incoming: people(w.incoming, at), outgoing: people(w.outgoing, at) };
}

export function normaliseBlocked(raw: unknown): (PersonCard & { blocked_at: string | null })[] {
  return people((raw as Wire)?.users, (w) => ({ blocked_at: str(w.blocked_at) }));
}

export function normaliseUsernameCheck(raw: unknown): UsernameCheck {
  const w = (raw ?? {}) as Wire;
  return {
    ...(typeof w.username === 'string' ? { username: w.username } : {}),
    ...(typeof w.available === 'boolean' ? { available: w.available } : {}),
    ...('reason' in w ? { reason: str(w.reason) } : {}),
    ...('current' in w ? { current: str(w.current) } : {}),
    ...(Array.isArray(w.suggestions) ? { suggestions: w.suggestions.filter((s: unknown) => typeof s === 'string') } : {}),
  };
}

export function normaliseUnread(raw: unknown): UnreadCounts {
  const w = (raw ?? {}) as Wire;
  return { inbox: num(w.inbox), requests: num(w.requests) };
}

function receipt(value: unknown): ReceiptState | null {
  return RECEIPTS.includes(value as string) ? (value as ReceiptState) : null;
}

export function normaliseConversation(raw: unknown): ConversationSummary | null {
  const w = (raw ?? {}) as Wire;
  const id = str(w.id);
  const other = normalisePerson(w.other);
  if (!id || !other) return null;
  const lm = w.last_message as Wire | null;
  return {
    id,
    other,
    is_request: bool(w.is_request),
    unread_count: num(w.unread_count),
    can_write: w.can_write !== false,
    last_message_at: str(w.last_message_at),
    last_message:
      lm && str(lm.id)
        ? {
            id: lm.id,
            sender_id: str(lm.sender_id) ?? '',
            kind: (KINDS.includes(lm.kind) ? lm.kind : 'text') as MessageKind,
            status: lm.status === 'removed' ? 'removed' : 'visible',
            created_at: str(lm.created_at) ?? '',
            preview: {
              key: str(lm.preview?.key) ?? 'empty',
              text: str(lm.preview?.text),
            },
            receipt: receipt(lm.receipt),
          }
        : null,
  };
}

export function normaliseInbox(raw: unknown): InboxPage {
  const w = (raw ?? {}) as Wire;
  return {
    conversations: list(w.conversations)
      .map(normaliseConversation)
      .filter((c): c is ConversationSummary => c !== null),
    next_before: str(w.next_before),
    unread: normaliseUnread(w.unread),
  };
}

export function normaliseConversationHeader(raw: unknown): ConversationHeader | null {
  const w = (raw ?? {}) as Wire;
  const id = str(w.id);
  const other = normalisePerson(w.other);
  if (!id || !other) return null;
  return {
    id,
    other,
    relationship: normaliseRelationship(w.relationship),
    is_request: bool(w.is_request),
    can_write: w.can_write === true,
    write_blocked_reason: w.write_blocked_reason === 'you_blocked' || w.write_blocked_reason === 'unavailable' ? w.write_blocked_reason : null,
    other_last_delivered_at: str(w.other_last_delivered_at),
    other_last_read_at: str(w.other_last_read_at),
  };
}

function normaliseAttachment(w: Wire): MessageAttachment | null {
  const id = str(w.id);
  if (!id) return null;
  return {
    id,
    mime_type: str(w.mime_type) ?? 'image/jpeg',
    width: typeof w.width === 'number' ? w.width : null,
    height: typeof w.height === 'number' ? w.height : null,
    url: str(w.url),
    url_expires_at: str(w.url_expires_at),
  };
}

/**
 * The three embed shapes arrive differently — a post card, a media teaser (the
 * Casa Media serializer's shape) and a person card — and fold into one.
 */
export function normaliseEmbed(raw: unknown): MessageEmbed | null {
  if (!raw || typeof raw !== 'object') return null;
  const w = raw as Wire;
  const kind = EMBEDS.includes(w.kind) ? (w.kind as EmbedKind) : null;
  const id = str(w.id);
  if (!kind || !id) return null;

  const base: MessageEmbed = {
    kind,
    id,
    available: w.available === true,
    title: null,
    subtitle: null,
    image_url: null,
    locked: false,
    person: null,
  };
  if (!base.available) return base;

  if (kind === 'post') {
    const author = normalisePerson(w.author);
    return { ...base, title: author?.name ?? null, subtitle: str(w.title) ?? str(w.body), image_url: str(w.thumbnail_url), person: author };
  }
  if (kind === 'media_item') {
    return {
      ...base,
      title: str(w.title),
      subtitle: str(w.short_description),
      image_url: str(w.cover?.url),
      locked: w.locked === true,
    };
  }
  const person = normalisePerson(w);
  return { ...base, title: person?.name ?? null, subtitle: person?.username ? `@${person.username}` : null, image_url: person?.avatar_url ?? null, person };
}

export function normaliseMessage(raw: unknown): ChatMessage | null {
  const w = (raw ?? {}) as Wire;
  const id = str(w.id);
  const conversationId = str(w.conversation_id);
  const senderId = str(w.sender_id);
  const createdAt = str(w.created_at);
  if (!id || !conversationId || !senderId || !createdAt) return null;
  const removed = w.status === 'removed';
  return {
    id,
    conversation_id: conversationId,
    sender_id: senderId,
    kind: (KINDS.includes(w.kind) ? w.kind : 'text') as MessageKind,
    body: removed ? null : str(w.body),
    status: removed ? 'removed' : 'visible',
    client_id: str(w.client_id),
    created_at: createdAt,
    attachments: removed ? [] : list(w.attachments).map(normaliseAttachment).filter((a): a is MessageAttachment => a !== null),
    embed: removed ? null : normaliseEmbed(w.embed),
    receipt: receipt(w.receipt),
  };
}

export function normaliseMessages(raw: unknown): MessagesPage {
  const w = (raw ?? {}) as Wire;
  return {
    messages: list(w.messages).map(normaliseMessage).filter((m): m is ChatMessage => m !== null),
    nextCursor: str(w.nextCursor),
  };
}

export function normaliseShare(raw: unknown): ShareResult[] {
  return list((raw as Wire)?.results)
    .map((r) => (str(r.user_id) ? { user_id: r.user_id, ok: r.ok === true, ...(str(r.conversation_id) ? { conversation_id: r.conversation_id } : {}), ...(str(r.reason) ? { reason: r.reason } : {}) } : null))
    .filter((r): r is ShareResult => r !== null);
}
