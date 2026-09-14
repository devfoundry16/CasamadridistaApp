/**
 * Recorded-response contract test for Casa Social.
 *
 * The fixtures are NOT invented: they are the literal output of the backend's
 * own services (`profileService.getProfile`, `messageService.inbox`,
 * `listMessages`, `getConversation`) and the Casa Media `serializers.teaser`,
 * produced through `backend/test/fakeSupabase.js` and pasted in. If the backend
 * renames a key, regenerate the fixture — the failure names the screen that moves.
 *
 * Run with:  node --test utils/__tests__/socialContract.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  INLINED_VOCABULARIES,
  normaliseConversationHeader,
  normaliseEmbed,
  normaliseInbox,
  normaliseMessage,
  normaliseMessages,
  normaliseProfile,
  normaliseRelationship,
  normaliseSearch,
  normaliseShare,
  normaliseUsernameCheck,
} from '../../services/social/normalise.ts';
import {
  EMBED_KINDS,
  MESSAGE_KINDS,
  RELATIONSHIP_STATES,
  SOCIAL_REPORT_REASONS,
} from '../../types/social.ts';

const B = '00000000-0000-4000-8000-00000000000b';
const CONV = 'c0000000-0000-4000-8000-000000000001';

// profileService.getProfile(A, B) — A and B are friends, B is a member.
const WIRE_PROFILE = {"user":{"id":"00000000-0000-4000-8000-00000000000b","username":"alifayad","name":"Ali Fayad","avatar_url":"https://x/a.jpg","country_code":"LB","is_member":true,"is_verified":false,"bio":"Hala Madrid 🤍","joined_at":"2024-03-01T00:00:00Z","last_active_at":"2026-09-13T10:00:00Z"},"stats":{"posts":128,"friends":46,"joined_year":2024},"relationship":{"state":"friends","can_message":true}};

// messageService.inbox(A)
const WIRE_INBOX = {"conversations":[{"id":"c0000000-0000-4000-8000-000000000001","other":{"id":"00000000-0000-4000-8000-00000000000b","username":"alifayad","name":"Ali Fayad","avatar_url":"https://x/a.jpg","country_code":"LB","is_member":false,"is_verified":false},"is_request":false,"unread_count":0,"can_write":true,"last_message":{"id":"11111111-1111-4111-8111-111111111111","sender_id":"00000000-0000-4000-8000-00000000000a","kind":"text","embed_kind":null,"status":"visible","created_at":"2026-09-13T10:00:00Z","preview":{"key":"text","text":"Vamos"},"receipt":"delivered"},"last_message_at":"2026-09-13T10:00:00Z"}],"next_before":null,"unread":{"inbox":2,"requests":1}};

// messageService.listMessages(A, CONV) — a shared profile from A, a text from B.
const WIRE_MESSAGES = {"messages":[{"id":"22222222-2222-4222-8222-222222222222","conversation_id":"c0000000-0000-4000-8000-000000000001","sender_id":"00000000-0000-4000-8000-00000000000a","kind":"share","body":"look","status":"visible","client_id":"c_share01","created_at":"2026-09-13T10:00:20Z","attachments":[],"embed":{"kind":"profile","id":"00000000-0000-4000-8000-00000000000b","available":true,"username":"alifayad","name":"Ali Fayad","avatar_url":"https://x/a.jpg","country_code":"LB","is_member":false,"is_verified":false},"receipt":"delivered"},{"id":"33333333-3333-4333-8333-333333333333","conversation_id":"c0000000-0000-4000-8000-000000000001","sender_id":"00000000-0000-4000-8000-00000000000b","kind":"text","body":"hola","status":"visible","client_id":null,"created_at":"2026-09-13T10:00:00Z","attachments":[],"embed":null,"receipt":null}],"nextCursor":null};

// messageService.getConversation(A, CONV) — a request A has not accepted.
const WIRE_HEADER = {"id":"c0000000-0000-4000-8000-000000000001","other":{"id":"00000000-0000-4000-8000-00000000000b","username":"alifayad","name":"Ali Fayad","avatar_url":"https://x/a.jpg","country_code":"LB","is_member":false,"is_verified":false},"relationship":"none","is_request":true,"can_write":true,"write_blocked_reason":null,"other_last_delivered_at":null,"other_last_read_at":null};

// embedService for a premium media item seen by a free account: the teaser.
const WIRE_MEDIA_EMBED = {"kind":"media_item","id":"44444444-4444-4444-8444-444444444444","available":true,"type":"video","video_format":null,"status":"published","title":"Bernabéu tunnel","short_description":"Before kick-off","language":null,"match_phase":null,"match":null,"category":null,"contributor":null,"cover":{"url":"https://cdn/c.jpg","blurhash":null,"width":null,"height":null},"access_level":"premium","required_tiers":[],"comments_enabled":true,"published_at":"2026-09-12T18:00:00Z","expires_at":null,"asset_count":0,"counts":{"views":0,"likes":0,"comments":0,"shares":0,"saves":0,"story_views":0},"locked":true,"lock_reason":"premium_required","viewer":{"liked":false,"saved":false},"deep_link":"casamadridistaapp://media/item/44444444-4444-4444-8444-444444444444","web_url":null};

describe('vocabularies', () => {
  it('the inlined copies in normalise.ts match types/social.ts', () => {
    assert.deepEqual([...INLINED_VOCABULARIES.RELATIONSHIPS], [...RELATIONSHIP_STATES]);
    assert.deepEqual([...INLINED_VOCABULARIES.KINDS], [...MESSAGE_KINDS]);
    assert.deepEqual([...INLINED_VOCABULARIES.EMBEDS], [...EMBED_KINDS]);
  });

  it('the report reasons are §23 verbatim, as the backend freezes them', () => {
    assert.deepEqual([...SOCIAL_REPORT_REASONS], ['spam', 'harassment', 'hate', 'sexual', 'impersonation', 'scam', 'threat', 'other']);
  });

  it('a relationship the app does not know reads as none, never as friends', () => {
    assert.equal(normaliseRelationship('blocked'), 'none');
    assert.equal(normaliseRelationship(undefined), 'none');
    assert.equal(normaliseRelationship('friends'), 'friends');
  });
});

describe('profile', () => {
  it('folds the profile envelope', () => {
    const p = normaliseProfile(WIRE_PROFILE)!;
    assert.equal(p.user.id, B);
    assert.equal(p.user.name, 'Ali Fayad');
    assert.equal(p.user.is_member, true);
    assert.equal(p.user.bio, 'Hala Madrid 🤍');
    assert.deepEqual(p.stats, { posts: 128, friends: 46, joined_year: 2024 });
    assert.deepEqual(p.relationship, { state: 'friends', can_message: true });
    assert.equal('show_activity' in p.user, false, 'settings are only present on your own profile');
  });

  it('an account without a name still renders, by handle', () => {
    const p = normaliseProfile({ ...WIRE_PROFILE, user: { ...WIRE_PROFILE.user, name: null } })!;
    assert.equal(p.user.name, 'alifayad');
  });

  it('a profile with no user is null, so the screen shows not-available', () => {
    assert.equal(normaliseProfile({}), null);
    assert.equal(normaliseProfile(null), null);
  });
});

describe('inbox and thread', () => {
  it('folds the inbox', () => {
    const page = normaliseInbox(WIRE_INBOX);
    assert.deepEqual(page.unread, { inbox: 2, requests: 1 });
    const [c] = page.conversations;
    assert.equal(c.id, CONV);
    assert.equal(c.other.name, 'Ali Fayad');
    assert.equal(c.last_message?.preview.text, 'Vamos');
    assert.equal(c.last_message?.receipt, 'delivered');
  });

  it('folds a thread page, including a shared profile card', () => {
    const page = normaliseMessages(WIRE_MESSAGES);
    assert.equal(page.messages.length, 2);
    const [share, text] = page.messages;
    assert.equal(share.kind, 'share');
    assert.equal(share.embed?.kind, 'profile');
    assert.equal(share.embed?.available, true);
    assert.equal(share.embed?.title, 'Ali Fayad');
    assert.equal(share.embed?.subtitle, '@alifayad');
    assert.equal(share.receipt, 'delivered');
    assert.equal(text.receipt, null);
    assert.equal(text.client_id, null);
  });

  it('a shared premium media item stays locked — the lock comes from the server', () => {
    const embed = normaliseEmbed(WIRE_MEDIA_EMBED)!;
    assert.equal(embed.locked, true);
    assert.equal(embed.title, 'Bernabéu tunnel');
    assert.equal(embed.image_url, 'https://cdn/c.jpg');
  });

  it('an unavailable embed carries nothing but its kind and id', () => {
    const embed = normaliseEmbed({ kind: 'post', id: 'p1', available: false })!;
    assert.deepEqual(embed, { kind: 'post', id: 'p1', available: false, title: null, subtitle: null, image_url: null, locked: false, person: null });
  });

  it('a removed message loses its content even if a body slipped through', () => {
    const m = normaliseMessage({ ...WIRE_MESSAGES.messages[1], status: 'removed', body: 'nasty' })!;
    assert.equal(m.body, null);
    assert.equal(m.embed, null);
  });

  it('folds the thread header, and a composer is disabled unless the server says it may write', () => {
    const h = normaliseConversationHeader(WIRE_HEADER)!;
    assert.equal(h.is_request, true);
    assert.equal(h.can_write, true);
    assert.equal(normaliseConversationHeader({ ...WIRE_HEADER, can_write: undefined })!.can_write, false);
  });
});

describe('small envelopes', () => {
  it('search rows carry their relationship', () => {
    const rows = normaliseSearch({ users: [{ ...WIRE_INBOX.conversations[0].other, relationship: 'request_received' }, { nope: true }] });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].relationship, 'request_received');
  });

  it('share results keep a per-recipient outcome', () => {
    assert.deepEqual(normaliseShare({ results: [{ user_id: 'a', ok: true, conversation_id: 'c' }, { user_id: 'b', ok: false, reason: 'blocked' }] }), [
      { user_id: 'a', ok: true, conversation_id: 'c' },
      { user_id: 'b', ok: false, reason: 'blocked' },
    ]);
  });

  it('a username check keeps only the keys the server sent', () => {
    assert.deepEqual(normaliseUsernameCheck({ username: 'ali', available: false, reason: 'taken' }), { username: 'ali', available: false, reason: 'taken' });
    assert.deepEqual(normaliseUsernameCheck({ current: null, suggestions: ['a', 2, 'b'] }), { current: null, suggestions: ['a', 'b'] });
  });
});
