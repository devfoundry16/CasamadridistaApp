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
  isCancelGesture,
  mergeMessages,
  messageActions,
  needsFetch,
  nextRate,
  recordingOutcome,
  REACTIONS,
  RECORD_MAX_MS,
  unsentCopy,
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
