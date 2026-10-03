/**
 * Direct messages, C2: voice notes, videos, reactions, replies, delete for me
 * and unsend.
 *
 * Run with:  node --test utils/__tests__/chatExtras.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  applyReaction,
  formatDuration,
  freshPage,
  isCancelGesture,
  dropForMe,
  mergeMessages,
  messageActions,
  messageFromEvent,
  needsFetch,
  nextRate,
  recordingOutcome,
  retract,
  REACTIONS,
  RECORD_MAX_MS,
  undoDrop,
  undoRetract,
  unsentCopy,
  viewerStillAllowed,
  videoPickProblem,
} from '../chat.core.ts';

const msg = (over: Record<string, unknown> = {}) => ({
  id: 'm1', conversation_id: 'c', sender_id: 'me', kind: 'text', body: 'hi', status: 'visible', client_id: null,
  created_at: '2026-10-03T10:00:00Z', attachments: [], embed: null, receipt: null, reply_to: null,
  reactions: { counts: [], mine: null }, ...over,
}) as any;

describe('formatDuration', () => {
  it('reads as m:ss', () => {
    assert.equal(formatDuration(0), '0:00');
    assert.equal(formatDuration(7_400), '0:07');
    assert.equal(formatDuration(65_000), '1:05');
    assert.equal(formatDuration(RECORD_MAX_MS), '2:00');
  });
  it('is 0:00 for nonsense', () => {
    assert.equal(formatDuration(Number.NaN), '0:00');
    assert.equal(formatDuration(-5), '0:00');
  });
});

describe('nextRate', () => {
  it('cycles 1× → 1.5× → 2× → 1×', () => {
    assert.equal(nextRate(1), 1.5);
    assert.equal(nextRate(1.5), 2);
    assert.equal(nextRate(2), 1);
    assert.equal(nextRate(3), 1);
  });
});

describe('recordingOutcome', () => {
  it('a slide to cancel throws it away', () => assert.equal(recordingOutcome(30_000, true), 'cancel'));
  it('a tap is too short to be a voice note', () => assert.equal(recordingOutcome(400, false), 'too_short'));
  it('otherwise it goes to preview', () => assert.equal(recordingOutcome(5_000, false), 'preview'));
});

describe('isCancelGesture', () => {
  it('slides toward the start edge: left in English, right in Arabic', () => {
    assert.equal(isCancelGesture(-100, false), true);
    assert.equal(isCancelGesture(100, false), false);
    assert.equal(isCancelGesture(100, true), true);
    assert.equal(isCancelGesture(-30, false), false);
  });
});

describe('applyReaction', () => {
  it('adds mine, replaces a previous one, and removes it', () => {
    const none = { counts: [], mine: null };
    const one = applyReaction(none, '❤️');
    assert.deepEqual(one, { counts: [{ emoji: '❤️', count: 1 }], mine: '❤️' });
    const swapped = applyReaction({ counts: [{ emoji: '❤️', count: 2 }], mine: '❤️' }, '🔥');
    assert.deepEqual(swapped, { counts: [{ emoji: '❤️', count: 1 }, { emoji: '🔥', count: 1 }], mine: '🔥' });
    assert.deepEqual(applyReaction(one, null), { counts: [], mine: null });
  });
  it('reacting again with the same emoji takes it back', () => {
    assert.deepEqual(applyReaction({ counts: [{ emoji: '❤️', count: 1 }], mine: '❤️' }, '❤️'), { counts: [], mine: null });
  });
  it('offers the quick set the server accepts', () => {
    assert.deepEqual([...REACTIONS], ['❤️', '😂', '😮', '😢', '🔥', '👍']);
  });
});

describe('messageActions', () => {
  it('my message: react, reply, copy, delete for me, unsend', () => {
    assert.deepEqual(messageActions(msg(), 'me'), ['react', 'reply', 'copy', 'hide', 'unsend']);
  });
  it('theirs: react, reply, copy, delete for me, report', () => {
    assert.deepEqual(messageActions(msg({ sender_id: 'them' }), 'me'), ['react', 'reply', 'copy', 'hide', 'report']);
  });
  it('a voice note has nothing to copy', () => {
    assert.deepEqual(messageActions(msg({ kind: 'voice', body: null }), 'me'), ['react', 'reply', 'hide', 'unsend']);
  });
  it('my unsent message, or a removed one, can only be deleted for me', () => {
    assert.deepEqual(messageActions(msg({ status: 'unsent', body: null }), 'me'), ['hide']);
    assert.deepEqual(messageActions(msg({ status: 'removed', body: null, sender_id: 'them' }), 'me'), ['hide']);
  });
  it('their unsent message can still be reported: the server kept it for review', () => {
    assert.deepEqual(messageActions(msg({ status: 'unsent', body: null, sender_id: 'them' }), 'me'), ['hide', 'report']);
  });
  it('a message still sending has no server actions', () => {
    assert.deepEqual(messageActions(msg({ id: 'local:abc' }), 'me'), ['copy']);
  });
});

describe('unsentCopy', () => {
  it('says who took it back', () => {
    assert.equal(unsentCopy(msg({ status: 'unsent' }), 'me'), 'social.thread.unsentByYou');
    assert.equal(unsentCopy(msg({ status: 'unsent', sender_id: 'them' }), 'me'), 'social.thread.unsent');
  });
});

describe('videoPickProblem', () => {
  it('a minute at most, 50 MB at most', () => {
    assert.equal(videoPickProblem({ durationMs: 30_000, fileSize: 1_000_000 }), null);
    assert.equal(videoPickProblem({ durationMs: 61_000, fileSize: 1_000_000 }), 'video_too_long');
    assert.equal(videoPickProblem({ durationMs: 30_000, fileSize: 51 * 1024 * 1024 }), 'video_too_large');
  });
});

describe('needsFetch', () => {
  it('a text reply is fetched, so its quote arrives', () => {
    assert.equal(needsFetch({ kind: 'text', reply_to_id: null } as any), false);
    assert.equal(needsFetch({ kind: 'text', reply_to_id: 'm0' } as any), true);
    assert.equal(needsFetch({ kind: 'voice' } as any), true);
  });
});

describe('mergeMessages and unsend', () => {
  const photo = (over: Record<string, unknown> = {}) => ({ id: 'a1', kind: 'image', mime_type: 'image/jpeg', width: 1, height: 1, url: 'https://u1', url_expires_at: '2026-10-03T10:15:00Z', ...over });
  it('an unsend beats a cached copy that still has its photo', () => {
    const cached = msg({ id: 'm1', kind: 'image', body: 'cap', attachments: [photo()] });
    const server = msg({ id: 'm1', kind: 'image', status: 'unsent', body: null, attachments: [] });
    const [out] = mergeMessages([cached], [server]);
    assert.equal(out.status, 'unsent');
    assert.equal(out.body, null);
    assert.deepEqual(out.attachments, []);
  });
  it('a stale page after the unsend event does not bring the text back', () => {
    const tomb = msg({ id: 'm1', status: 'unsent', body: null });
    const stale = msg({ id: 'm1', body: 'secret' });
    const [out] = mergeMessages([tomb], [stale]);
    assert.equal(out.status, 'unsent');
    assert.equal(out.body, null);
  });
  it('a removal still wins over an unsend', () => {
    const [out] = mergeMessages([msg({ id: 'm1', status: 'unsent', body: null })], [msg({ id: 'm1', status: 'removed', body: null })]);
    assert.equal(out.status, 'removed');
  });
});

describe('mergeMessages keeps a signed URL while it is good', () => {
  const now = Date.parse('2026-10-03T10:00:00Z');
  const withUrl = (url: string, expires: string) => msg({ id: 'm1', kind: 'voice', body: null, attachments: [{ id: 'a1', kind: 'voice', mime_type: 'audio/mp4', width: null, height: null, url, url_expires_at: expires }] });
  it('a refetch does not swap a live URL (playback and caches survive)', () => {
    const [out] = mergeMessages([withUrl('https://old', '2026-10-03T10:10:00Z')], [withUrl('https://new', '2026-10-03T10:15:00Z')], now);
    assert.equal(out.attachments[0].url, 'https://old');
  });
  it('a URL about to expire is replaced', () => {
    const [out] = mergeMessages([withUrl('https://old', '2026-10-03T10:00:30Z')], [withUrl('https://new', '2026-10-03T10:15:00Z')], now);
    assert.equal(out.attachments[0].url, 'https://new');
  });
  it('the newest reactions win', () => {
    const a = msg({ id: 'm1', reactions: { counts: [{ emoji: '❤️', count: 1 }], mine: null } });
    const b = msg({ id: 'm1', reactions: { counts: [{ emoji: '❤️', count: 2 }], mine: '❤️' } });
    assert.deepEqual(mergeMessages([a], [b], now)[0].reactions, b.reactions);
  });
});

describe('taking a message back also takes back every quote of it', () => {
  const original = msg({ id: 'o', body: 'secret', sender_id: 'them' });
  const reply = msg({ id: 'r', body: 'ok', created_at: '2026-10-03T10:01:00Z', reply_to: { id: 'o', sender_id: 'them', kind: 'text', status: 'visible', body: 'secret' } });
  const local = msg({ id: 'local:x', body: 'typing', created_at: '2026-10-03T10:02:00Z', reply_to: { id: 'o', sender_id: 'them', kind: 'text', status: 'visible', body: 'secret' } });
  const other = msg({ id: 'z', body: 'hi', created_at: '2026-10-03T10:03:00Z', reply_to: { id: 'q', sender_id: 'me', kind: 'text', status: 'visible', body: 'kept' } });
  const quotes = (list: any[]) => Object.fromEntries(list.filter((m) => m.reply_to).map((m) => [m.id, m.reply_to.body]));

  it('an unsend event blanks the bubble and the replies that quoted it, sent or still sending', () => {
    const out = retract([original, reply, local, other], 'o', 'unsent');
    assert.equal(out.find((m) => m.id === 'o')!.status, 'unsent');
    assert.equal(out.find((m) => m.id === 'o')!.body, null);
    assert.deepEqual(quotes(out), { r: null, 'local:x': null, z: 'kept' });
    assert.equal(out.find((m) => m.id === 'r')!.reply_to!.status, 'unavailable');
  });
  it('a removal does the same', () => {
    assert.deepEqual(quotes(retract([original, reply], 'o', 'removed')), { r: null });
  });
  it('deleting it for me removes it and blanks my quotes of it', () => {
    const out = dropForMe([original, reply, other], 'o');
    assert.deepEqual(out.map((m) => m.id).sort(), ['r', 'z']);
    assert.deepEqual(quotes(out), { r: null, z: 'kept' });
  });
  it('a tombstone that arrives by fetch blanks quotes still cached from an older page', () => {
    const out = mergeMessages([original, reply], [msg({ id: 'o', status: 'unsent', body: null, sender_id: 'them' })]);
    assert.deepEqual(quotes(out), { r: null });
  });
  it('nothing leaks back: a stale copy of the reply cannot restore the quote', () => {
    const retracted = retract([original, reply], 'o', 'unsent');
    assert.deepEqual(quotes(mergeMessages(retracted, [reply])), { r: null });
  });
});

describe('reopening a thread starts from what the server says now', () => {
  const old = msg({ id: 'old', body: 'unsent while the chat was closed', created_at: '2026-10-01T10:00:00Z' });
  const kept = msg({ id: 'new', body: 'still here', created_at: '2026-10-03T10:00:00Z' });
  const sending = msg({ id: 'local:abc', client_id: 'abc', body: 'on its way', created_at: '2026-10-03T10:05:00Z', receipt: 'pending' });

  it('drops cached older pages: they are fetched again on scroll, so nothing stale survives', () => {
    const out = freshPage([old, kept, sending], [kept]);
    assert.deepEqual(out.map((m) => m.id), ['local:abc', 'new']);
  });
  it('keeps a message still being sent', () => {
    assert.ok(freshPage([sending], []).some((m) => m.id === 'local:abc'));
  });
  it('a tombstone in the fresh page replaces the cached content', () => {
    const [m] = freshPage([kept], [msg({ id: 'new', status: 'unsent', body: null, created_at: kept.created_at })]);
    assert.equal(m.status, 'unsent');
    assert.equal(m.body, null);
  });
});

describe('an open photo or video closes when its message is taken back', () => {
  const list = [msg({ id: 'a', kind: 'image' }), msg({ id: 'b', kind: 'video', status: 'unsent' })];
  it('stays open while the message is visible', () => assert.equal(viewerStillAllowed(list, 'a'), true));
  it('closes when it was unsent or removed', () => assert.equal(viewerStillAllowed(list, 'b'), false));
  it('closes when it was deleted for me, or is no longer loaded', () => assert.equal(viewerStillAllowed(list, 'zzz'), false));
});

describe('the server copy is the truth: a cached copy never beats it', () => {
  const att = (id: string) => ({ id, kind: 'image', mime_type: 'image/jpeg', width: 1, height: 1, url: `https://u/${id}`, url_expires_at: '2099-01-01T00:00:00Z' });
  const card = { kind: 'post', id: 'p1', available: true, title: 'x' };
  it('a cached copy with more photos and a card loses to a server copy that has fewer', () => {
    const cached = msg({ id: 'm1', kind: 'image', attachments: [att('a'), att('b')], embed: card });
    const server = msg({ id: 'm1', kind: 'image', attachments: [att('a')], embed: null });
    const [out] = mergeMessages([cached], [server], Date.parse('2026-10-03T10:00:00Z'));
    assert.deepEqual(out.attachments.map((x: any) => x.id), ['a']);
    assert.equal(out.embed, null);
  });
  it('a card the server now reports unavailable replaces the cached one', () => {
    const cached = msg({ id: 'm1', kind: 'share', embed: card });
    const server = msg({ id: 'm1', kind: 'share', embed: { kind: 'post', id: 'p1', available: false } });
    assert.equal((mergeMessages([cached], [server])[0].embed as any).available, false);
  });
  it('a bare realtime event does not wipe what the server copy carries', () => {
    const server = msg({ id: 'm1', body: 'hi', sender_id: 'them', reactions: { counts: [{ emoji: '❤️', count: 1 }], mine: null }, reply_to: { id: 'o', sender_id: 'me', kind: 'text', status: 'visible', body: 'q' } });
    const event = messageFromEvent({ id: 'm1', conversation_id: 'c', sender_id: 'them', kind: 'text', body: 'hi', embed_kind: null, client_id: null, created_at: server.created_at } as any, 'me')!;
    const [out] = mergeMessages([server], [event]);
    assert.equal(out.reactions.counts.length, 1);
    assert.equal(out.reply_to!.body, 'q');
  });
});

describe('a quote, once unavailable, stays unavailable', () => {
  const visible = { id: 'o', sender_id: 'them', kind: 'text', status: 'visible', body: 'secret' };
  const gone = { id: 'o', sender_id: 'them', kind: 'text', status: 'unavailable', body: null };
  it('the server says unavailable: a cached reply cannot keep the text (the original may be on a page no longer loaded)', () => {
    const [out] = mergeMessages([msg({ id: 'r', reply_to: visible })], [msg({ id: 'r', reply_to: gone })]);
    assert.equal(out.reply_to!.body, null);
  });
  it('a stale copy cannot bring the text back', () => {
    const [out] = mergeMessages([msg({ id: 'r', reply_to: gone })], [msg({ id: 'r', reply_to: visible })]);
    assert.equal(out.reply_to!.status, 'unavailable');
    assert.equal(out.reply_to!.body, null);
  });
});

describe('undoing an optimistic unsend or delete that the server refused', () => {
  const original = msg({ id: 'o', body: 'mine' });
  const reply = msg({ id: 'r', created_at: '2026-10-03T10:01:00Z', reply_to: { id: 'o', sender_id: 'me', kind: 'text', status: 'visible', body: 'mine' } });
  const before = [original, reply];

  it('puts the message and the quotes of it back', () => {
    const out = undoRetract(retract(before, 'o', 'unsent'), before, 'o');
    assert.equal(out.find((m) => m.id === 'o')!.body, 'mine');
    assert.equal(out.find((m) => m.id === 'r')!.reply_to!.body, 'mine');
  });
  it('but never over a removal that arrived meanwhile: nothing comes back', () => {
    const now = retract(retract(before, 'o', 'unsent'), 'o', 'removed');
    const out = undoRetract(now, before, 'o');
    assert.equal(out.find((m) => m.id === 'o')!.status, 'removed');
    assert.equal(out.find((m) => m.id === 'o')!.body, null);
    assert.equal(out.find((m) => m.id === 'r')!.reply_to!.body, null);
  });
  it('a refused delete-for-me puts the message and my quotes back', () => {
    const out = undoDrop(dropForMe(before, 'o'), before, 'o');
    assert.deepEqual(out.map((m) => m.id).sort(), ['o', 'r']);
    assert.equal(out.find((m) => m.id === 'r')!.reply_to!.body, 'mine');
  });
  it('a refused delete-for-me does not revive a message unsent meanwhile', () => {
    const now = dropForMe(before, 'o');
    const out = undoDrop(now, [msg({ id: 'o', status: 'unsent', body: null }), reply], 'o');
    assert.equal(out.find((m) => m.id === 'o')!.body, null);
  });
});
