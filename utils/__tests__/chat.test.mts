import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  applyReceipts,
  badgeText,
  bubbleLayout,
  bubbleRadii,
  controlShape,
  isTyping,
  maxReceipt,
  mergeMessages,
  messageFromEvent,
  needsFetch,
  newClientId,
  newestFromOthers,
  optimisticState,
  presenceLabel,
  receiptFor,
  shouldSendTyping,
} from '../chat.core.ts';
import type { ChatMessage } from '../../types/social.ts';

const ME = 'me';
const THEM = 'them';

const msg = (over: Partial<ChatMessage>): ChatMessage => ({
  id: 'm',
  conversation_id: 'c1',
  sender_id: ME,
  kind: 'text',
  body: 'hi',
  status: 'visible',
  client_id: null,
  created_at: '2026-09-13T10:00:00.000Z',
  attachments: [],
  embed: null,
  receipt: null,
  ...over,
});

describe('client ids', () => {
  it('match the server pattern, so a retry is recognised instead of posted twice', () => {
    const id = newClientId(Date.parse('2026-09-13T10:00:00Z'), 'a1-b2/c3==d4e5f6g7h8');
    assert.match(id, /^[A-Za-z0-9_-]{8,64}$/);
    assert.match(newClientId(0, ''), /^[A-Za-z0-9_-]{8,64}$/);
  });
});

describe('mergeMessages', () => {
  it('orders newest first, for the inverted list', () => {
    const out = mergeMessages(
      [msg({ id: 'a', created_at: '2026-09-13T10:00:00Z' })],
      [msg({ id: 'b', created_at: '2026-09-13T10:05:00Z' })],
    );
    assert.deepEqual(out.map((m) => m.id), ['b', 'a']);
  });

  it('a fetch racing a broadcast yields one message, keeping the richer copy', () => {
    const broadcast = msg({ id: 'x', kind: 'share', embed: null });
    const fetched = msg({
      id: 'x',
      kind: 'share',
      embed: { kind: 'post', id: 'p', available: true, title: 't', subtitle: null, image_url: null, locked: false, person: null },
    });
    const out = mergeMessages([broadcast], [fetched]);
    assert.equal(out.length, 1);
    assert.ok(out[0].embed);
    assert.equal(mergeMessages([fetched], [broadcast])[0].embed?.id, 'p', 'order does not matter');
  });

  it('the server copy replaces the optimistic bubble with the same client id', () => {
    const local = msg({
      id: 'local:c_1',
      client_id: 'c_1',
      receipt: 'pending',
      kind: 'image',
      attachments: [{ id: 'l', mime_type: 'image/jpeg', width: 1, height: 1, url: null, url_expires_at: null, local_uri: 'file:///a.jpg' }],
    });
    const server = msg({
      id: 's1',
      client_id: 'c_1',
      receipt: 'sent',
      kind: 'image',
      attachments: [{ id: 'a', mime_type: 'image/jpeg', width: 1, height: 1, url: 'https://signed', url_expires_at: null }],
    });
    const out = mergeMessages([local], [server]);
    assert.deepEqual(out.map((m) => m.id), ['s1']);
    assert.equal(out[0].attachments[0].local_uri, 'file:///a.jpg', 'the local preview bridges the signed URL load');
  });

  it('an optimistic bubble arriving after its server copy is dropped', () => {
    const server = msg({ id: 's1', client_id: 'c_1', receipt: 'sent' });
    const local = msg({ id: 'local:c_1', client_id: 'c_1', receipt: 'pending' });
    assert.deepEqual(mergeMessages([server], [local]).map((m) => m.id), ['s1']);
  });

  it('a removal is never undone by a stale copy', () => {
    const removed = msg({ id: 'x', status: 'removed', body: null });
    const stale = msg({ id: 'x', status: 'visible', body: 'nasty' });
    const out = mergeMessages([removed], [stale]);
    assert.equal(out[0].status, 'removed');
    assert.equal(out[0].body, null);
  });

  it('a receipt never goes backwards when an older copy arrives', () => {
    const out = mergeMessages([msg({ id: 'x', receipt: 'seen' })], [msg({ id: 'x', receipt: 'sent' })]);
    assert.equal(out[0].receipt, 'seen');
  });
});

describe('receipts', () => {
  it('mirror the backend: read wins, then delivered, else sent', () => {
    const at = '2026-09-13T10:00:00Z';
    assert.equal(receiptFor(at, { last_delivered_at: null, last_read_at: null }), 'sent');
    assert.equal(receiptFor(at, { last_delivered_at: '2026-09-13T10:00:00Z', last_read_at: null }), 'delivered');
    assert.equal(receiptFor(at, { last_delivered_at: null, last_read_at: '2026-09-13T10:00:01Z' }), 'seen');
  });

  it('are applied to my messages only, and never to one still pending', () => {
    const list = [
      msg({ id: 'mine', created_at: '2026-09-13T10:00:00Z', receipt: 'sent' }),
      msg({ id: 'local:c', created_at: '2026-09-13T10:00:00Z', receipt: 'pending' }),
      msg({ id: 'theirs', sender_id: THEM, receipt: null }),
    ];
    const out = applyReceipts(list, ME, { last_delivered_at: '2026-09-13T10:01:00Z', last_read_at: null });
    assert.deepEqual(out.map((m) => m.receipt), ['delivered', 'pending', null]);
  });

  it('return the same array when nothing changed, so React skips a render', () => {
    const list = [msg({ id: 'mine', receipt: 'seen' })];
    assert.equal(applyReceipts(list, ME, { last_delivered_at: null, last_read_at: null }), list);
  });

  it('a server receipt supersedes a device-only failure', () => {
    assert.equal(maxReceipt('failed', 'sent'), 'sent');
    assert.equal(maxReceipt('delivered', 'sent'), 'delivered');
    assert.equal(maxReceipt(null, 'seen'), 'seen');
  });

  it('the read acknowledgement points at the newest message from the other person', () => {
    const list = [msg({ id: 'mine' }), msg({ id: 't2', sender_id: THEM }), msg({ id: 't1', sender_id: THEM })];
    assert.equal(newestFromOthers(list, ME)?.id, 't2');
    assert.equal(newestFromOthers([msg({ id: 'mine' })], ME), null);
  });
});

describe('realtime events', () => {
  it('only text renders straight from a broadcast; photos and shares are fetched', () => {
    const event = { id: 'e', conversation_id: 'c1', sender_id: THEM, kind: 'text' as const, body: 'hola', embed_kind: null, client_id: 'their_client', created_at: '2026-09-13T10:00:00Z' };
    const m = messageFromEvent(event, ME)!;
    assert.equal(m.body, 'hola');
    assert.equal(m.client_id, null, 'their client id is not ours');
    assert.equal(m.receipt, null);
    assert.equal(messageFromEvent({ ...event, kind: 'image' }, ME), null);
    assert.equal(needsFetch({ kind: 'share' }), true);
    assert.equal(needsFetch({ kind: 'text' }), false);
  });
});

describe('bubble layout', () => {
  const list = [
    msg({ id: '4', sender_id: THEM, created_at: '2026-09-14T09:00:00Z' }),
    msg({ id: '3', created_at: '2026-09-13T10:02:00Z' }),
    msg({ id: '2', created_at: '2026-09-13T10:01:00Z' }),
    msg({ id: '1', created_at: '2026-09-13T09:00:00Z' }),
  ];

  it('clusters a run from one sender within three minutes', () => {
    assert.deepEqual(bubbleLayout(list, 2, ME), { mine: true, joinsPrevious: false, joinsNext: true, startsDay: false });
    assert.deepEqual(bubbleLayout(list, 1, ME), { mine: true, joinsPrevious: true, joinsNext: false, startsDay: false });
  });

  it('starts a new day above the oldest message and at a date change', () => {
    assert.equal(bubbleLayout(list, 3, ME).startsDay, true);
    assert.equal(bubbleLayout(list, 0, ME).startsDay, true);
  });

  it('puts the tail on the trailing corner for mine and the leading corner for theirs, as logical corners', () => {
    const mine = bubbleRadii({ mine: true, joinsPrevious: false, joinsNext: false });
    const theirs = bubbleRadii({ mine: false, joinsPrevious: false, joinsNext: false });
    assert.equal(mine.borderBottomEndRadius, 4);
    assert.equal(mine.borderBottomStartRadius, 16);
    assert.equal(theirs.borderBottomStartRadius, 4);
    assert.equal(theirs.borderBottomEndRadius, 16);
    // No physical left/right keys: RN flips start/end under RTL on its own.
    assert.equal(Object.keys(mine).some((k) => /Left|Right/.test(k)), false);
  });
});

describe('typing and presence', () => {
  it('typing is throttled on send and expires on receive', () => {
    assert.equal(shouldSendTyping(null, 1000), true);
    assert.equal(shouldSendTyping(1000, 2000), false);
    assert.equal(shouldSendTyping(1000, 3600), true);
    assert.equal(isTyping(1000, 4000), true);
    assert.equal(isTyping(1000, 6000), false);
    assert.equal(isTyping(null, 0), false);
  });

  it('online beats any timestamp, and "last active" stops after a week', () => {
    const now = Date.parse('2026-09-13T12:00:00Z');
    assert.deepEqual(presenceLabel(true, '2026-01-01T00:00:00Z', now), { key: 'online' });
    assert.deepEqual(presenceLabel(false, '2026-09-13T11:55:00Z', now), { key: 'activeMinutes', value: 5 });
    assert.deepEqual(presenceLabel(false, '2026-09-13T09:00:00Z', now), { key: 'activeHours', value: 3 });
    assert.deepEqual(presenceLabel(false, '2026-09-10T12:00:00Z', now), { key: 'activeDays', value: 3 });
    assert.equal(presenceLabel(false, '2026-09-01T12:00:00Z', now), null);
    assert.equal(presenceLabel(false, null, now), null);
  });
});

describe('the relationship control', () => {
  it('changes shape with the relationship, and only a received request splits in two', () => {
    assert.equal(controlShape('none'), 'add');
    assert.equal(controlShape('request_sent'), 'requested');
    assert.equal(controlShape('request_received'), 'respond');
    assert.equal(controlShape('friends'), 'friends');
    assert.equal(controlShape('blocking'), 'blocking');
    assert.equal(controlShape('self'), 'self');
  });

  it('predicts the state each action leads to', () => {
    assert.equal(optimisticState('none', 'request'), 'request_sent');
    assert.equal(optimisticState('request_received', 'accept'), 'friends');
    assert.equal(optimisticState('friends', 'block'), 'blocking');
    assert.equal(optimisticState('blocking', 'unblock'), 'none', 'unblocking never restores a friendship');
    assert.equal(optimisticState('friends', 'nonsense'), 'friends');
  });

  it('badges cap at 9+', () => {
    assert.equal(badgeText(0), null);
    assert.equal(badgeText(4), '4');
    assert.equal(badgeText(12), '9+');
  });
});
