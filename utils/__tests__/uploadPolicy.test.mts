/**
 * Pure-logic tests for the contributor upload manager.
 *
 * Run with:  node --test utils/__tests__/uploadPolicy.test.mts
 *
 * `.mts` for the same reason as `mediaHelpers.test.mts`: it sits outside
 * tsconfig's `**\/*.ts` include, this repo has no test runner or test tsconfig,
 * and the file exists to be executed by Node's built-in runner rather than
 * type-checked as app source. `services/upload/uploadPolicy.core.ts` imports
 * nothing at all, which is what makes that possible — `UploadManager` itself
 * needs expo-file-system and cannot be reached from here.
 *
 * The four rules under test are the ones a simulator would never show you:
 * the retry ladder, whether an upload slot must be re-requested (and via which
 * endpoint), what survives being written to AsyncStorage and read back after an
 * app kill, and whether an item may be submitted with `publish_when_ready`.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CONCURRENCY,
  MAX_ATTEMPTS,
  QUEUE_ENTRY_TTL_MS,
  RETRY_BACKOFF_MS,
  SLOT_EXPIRY_SKEW_MS,
  backoffDelayMs,
  clampProgress,
  deserializeQueue,
  hasDeliveredBytes,
  isRunnable,
  isSlotExpired,
  itemReadiness,
  nextWakeUpAt,
  parseEntry,
  planFailure,
  planManualRetry,
  readiness,
  rehydrateEntry,
  resumeStatus,
  selectRunnable,
  serializeQueue,
  slotAction,
  type UploadEntry,
} from '../../services/upload/uploadPolicy.core.ts';

const NOW = 1_700_000_000_000;

function entry(patch: Partial<UploadEntry> = {}): UploadEntry {
  return {
    id: 'e1',
    itemId: 'item-1',
    assetId: null,
    kind: 'image',
    role: 'content',
    position: 0,
    localUri: 'file:///docs/uploads/e1.jpg',
    posterUri: null,
    mime: 'image/jpeg',
    sizeBytes: 1024,
    width: 3000,
    height: 2000,
    durationMs: null,
    status: 'queued',
    progress: 0,
    attempts: 0,
    error: null,
    provider: null,
    uploadUrl: null,
    method: null,
    expiresAt: null,
    nextAttemptAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...patch,
  };
}

/* ================================================================== */
describe('retry schedule', () => {
  it('is 2/4/8 s and then gives up', () => {
    assert.deepEqual([...RETRY_BACKOFF_MS], [2000, 4000, 8000]);
    assert.equal(MAX_ATTEMPTS, 3);
    assert.equal(backoffDelayMs(0), 2000);
    assert.equal(backoffDelayMs(1), 4000);
    assert.equal(backoffDelayMs(2), 8000);
    assert.equal(backoffDelayMs(3), null);
    assert.equal(backoffDelayMs(99), null);
  });

  it('treats a nonsense attempt count as a first attempt', () => {
    assert.equal(backoffDelayMs(-1), 2000);
    assert.equal(backoffDelayMs(Number.NaN), 2000);
  });

  it('re-queues with a deadline while attempts remain', () => {
    const first = planFailure(entry({ progress: 0.4 }), NOW, 'boom');
    assert.equal(first.status, 'queued');
    assert.equal(first.attempts, 1);
    assert.equal(first.error, 'boom');
    assert.equal(first.progress, 0, 'a partial upload restarts from zero');
    assert.equal(first.nextAttemptAt, NOW + 2000);

    const second = planFailure(first, NOW + 2000, 'boom');
    assert.equal(second.attempts, 2);
    assert.equal(second.nextAttemptAt, NOW + 2000 + 4000);

    const third = planFailure(second, NOW, 'boom');
    assert.equal(third.attempts, 3);
    assert.equal(third.status, 'queued');
    assert.equal(third.nextAttemptAt, NOW + 8000);

    // Three retries have now been spent; the fourth failure is terminal.
    const fourth = planFailure(third, NOW, 'boom');
    assert.equal(fourth.status, 'failed');
    assert.equal(fourth.nextAttemptAt, null);
  });

  it('does not mutate the entry it is given', () => {
    const original = entry();
    planFailure(original, NOW, 'boom');
    assert.equal(original.attempts, 0);
    assert.equal(original.status, 'queued');
  });

  it('restarts the whole ladder on a manual retry', () => {
    const dead = entry({ status: 'failed', attempts: 3, error: 'boom', progress: 0.9 });
    const retried = planManualRetry(dead, NOW);
    assert.equal(retried.status, 'queued');
    assert.equal(retried.attempts, 0);
    assert.equal(retried.error, null);
    assert.equal(retried.nextAttemptAt, null, 'a manual retry runs immediately');
  });
});

/* ================================================================== */
describe('slot expiry', () => {
  const iso = (at: number) => new Date(at).toISOString();

  it('expires a slot one minute early', () => {
    assert.equal(SLOT_EXPIRY_SKEW_MS, 60_000);
    // Still good: expiry is more than the skew away.
    assert.equal(isSlotExpired(iso(NOW + 60_001), NOW), false);
    // Exactly at the skew boundary counts as expired.
    assert.equal(isSlotExpired(iso(NOW + 60_000), NOW), true);
    assert.equal(isSlotExpired(iso(NOW - 1), NOW), true);
  });

  it('keeps a slot with no stated or unparseable expiry', () => {
    assert.equal(isSlotExpired(null, NOW), false);
    assert.equal(isSlotExpired(undefined, NOW), false);
    assert.equal(isSlotExpired('not-a-date', NOW), false);
  });

  it('creates on the first run, retries afterwards, and reuses a live slot', () => {
    assert.equal(slotAction(entry(), NOW), 'create');

    // An asset row exists but its URL was dropped on rehydrate.
    assert.equal(slotAction(entry({ assetId: 'a1' }), NOW), 'retry');

    // The slot we hold went stale while the app was backgrounded.
    assert.equal(
      slotAction(
        entry({ assetId: 'a1', uploadUrl: 'https://x/y', expiresAt: iso(NOW - 1) }),
        NOW,
      ),
      'retry',
    );

    assert.equal(
      slotAction(
        entry({ assetId: 'a1', uploadUrl: 'https://x/y', expiresAt: iso(NOW + 3600_000) }),
        NOW,
      ),
      'reuse',
    );
  });

  it('never re-sends bytes that are already on the server', () => {
    // Both delivered states short-circuit to the completion call…
    for (const status of ['uploaded', 'completing'] as const) {
      assert.equal(slotAction(entry({ status, assetId: 'a1' }), NOW), 'complete-only');
      // …even with a slot that has long since expired, because the bytes are
      // there and a Cloudflare direct-upload URL is single use anyway.
      assert.equal(
        slotAction(
          entry({ status, assetId: 'a1', uploadUrl: 'https://x/y', expiresAt: iso(NOW - 10_000) }),
          NOW,
        ),
        'complete-only',
      );
    }
  });

  it('falls back to `create` if bytes were delivered without an asset id', () => {
    // Not reachable in practice, but the guard must not hand back
    // 'complete-only' with nothing to complete.
    assert.equal(slotAction(entry({ status: 'uploaded', assetId: null }), NOW), 'create');
  });
});

/* ================================================================== */
describe('delivered bytes', () => {
  it('recognises exactly the two post-upload states', () => {
    assert.equal(hasDeliveredBytes(entry({ status: 'uploaded' })), true);
    assert.equal(hasDeliveredBytes(entry({ status: 'completing' })), true);
    for (const status of ['queued', 'preparing', 'uploading', 'processing', 'ready', 'failed'] as const) {
      assert.equal(hasDeliveredBytes(entry({ status })), false, status);
    }
  });

  it('resumes a failed completion at `uploaded`, not `queued`', () => {
    assert.equal(resumeStatus(entry({ status: 'completing' })), 'uploaded');
    assert.equal(resumeStatus(entry({ status: 'uploading' })), 'queued');

    const failedComplete = planFailure(entry({ status: 'completing', assetId: 'a1' }), NOW, 'HTTP 500');
    assert.equal(failedComplete.status, 'uploaded');
    assert.equal(failedComplete.progress, 1, 'no bytes were lost, so the bar stays full');
    assert.equal(failedComplete.nextAttemptAt, NOW + 2000);
    assert.equal(slotAction(failedComplete, NOW), 'complete-only');

    const failedUpload = planFailure(entry({ status: 'uploading', assetId: 'a1' }), NOW, 'reset');
    assert.equal(failedUpload.status, 'queued');
    assert.equal(failedUpload.progress, 0);
  });

  it('keeps a manual retry on the completion call', () => {
    const dead = entry({ status: 'failed', attempts: 3, assetId: 'a1' });
    assert.equal(planManualRetry(dead, NOW).status, 'queued');

    // A retry pressed while the entry is parked mid-completion.
    const parked = planManualRetry(entry({ status: 'uploaded', attempts: 2, assetId: 'a1' }), NOW);
    assert.equal(parked.status, 'uploaded');
    assert.equal(parked.attempts, 0);
    assert.equal(parked.progress, 1);
    assert.equal(slotAction(parked, NOW), 'complete-only');
  });

  it('exhausts the ladder into `failed` from a completion loop too', () => {
    let e = entry({ status: 'completing', assetId: 'a1' });
    for (let i = 0; i < 3; i += 1) {
      e = planFailure(e, NOW, 'HTTP 500');
      assert.equal(e.status, 'uploaded');
    }
    assert.equal(planFailure(e, NOW, 'HTTP 500').status, 'failed');
  });
});

/* ================================================================== */
describe('scheduling', () => {
  it('starts at most `concurrency` entries, oldest first', () => {
    const entries = [
      entry({ id: 'c', createdAt: NOW + 2 }),
      entry({ id: 'a', createdAt: NOW }),
      entry({ id: 'b', createdAt: NOW + 1 }),
    ];
    assert.deepEqual(
      selectRunnable(entries, NOW).map((e) => e.id),
      ['a', 'b'],
    );
    assert.equal(CONCURRENCY, 2);
  });

  it('counts both the running set and already-active rows as busy', () => {
    const entries = [entry({ id: 'a' }), entry({ id: 'b', status: 'uploading' })];
    // 'b' is active, so only one slot is free.
    assert.deepEqual(
      selectRunnable(entries, NOW).map((e) => e.id),
      ['a'],
    );
    // …and none once 'a' has been handed to a worker.
    assert.deepEqual(selectRunnable(entries, NOW, ['a']), []);
  });

  it('treats `uploaded` as runnable and `completing` as busy', () => {
    assert.equal(isRunnable(entry({ status: 'uploaded' }), NOW), true);
    assert.equal(isRunnable(entry({ status: 'completing' }), NOW), false);

    const entries = [entry({ id: 'a', status: 'uploaded' }), entry({ id: 'b' })];
    assert.deepEqual(
      selectRunnable(entries, NOW).map((e) => e.id),
      ['a', 'b'],
    );
  });

  it('waits on an `uploaded` entry that is inside its backoff', () => {
    const parked = entry({ status: 'uploaded', nextAttemptAt: NOW + 4000, attempts: 1 });
    assert.deepEqual(selectRunnable([parked], NOW), []);
    assert.equal(nextWakeUpAt([parked], NOW), NOW + 4000);
    assert.equal(selectRunnable([parked], NOW + 4000).length, 1);
  });

  it('holds an entry until its backoff deadline', () => {
    const waiting = entry({ nextAttemptAt: NOW + 1000, attempts: 1 });
    assert.equal(isRunnable(waiting, NOW), false);
    assert.equal(isRunnable(waiting, NOW + 1000), true);
    assert.deepEqual(selectRunnable([waiting], NOW), []);
    assert.equal(selectRunnable([waiting], NOW + 1000).length, 1);
  });

  it('reports the soonest wake-up, or null when nothing is waiting', () => {
    assert.equal(nextWakeUpAt([entry()], NOW), null);
    assert.equal(
      nextWakeUpAt(
        [entry({ id: 'a', nextAttemptAt: NOW + 8000 }), entry({ id: 'b', nextAttemptAt: NOW + 2000 })],
        NOW,
      ),
      NOW + 2000,
    );
  });

  it('clamps progress into 0..1', () => {
    assert.equal(clampProgress(-1), 0);
    assert.equal(clampProgress(2), 1);
    assert.equal(clampProgress(Number.NaN), 0);
    assert.equal(clampProgress(0.5), 0.5);
  });
});

/* ================================================================== */
describe('persistence', () => {
  it('demotes in-flight entries and forgets their slot on rehydrate', () => {
    const inFlight = entry({
      status: 'uploading',
      progress: 0.6,
      assetId: 'a1',
      uploadUrl: 'https://x/y',
    });
    const back = rehydrateEntry(inFlight);
    assert.equal(back.status, 'queued');
    assert.equal(back.progress, 0);
    assert.equal(back.uploadUrl, null, 'the URL may have expired while the app was dead');
    assert.equal(back.assetId, 'a1', 'the asset row survives, so a retry can reuse it');
    assert.equal(back.nextAttemptAt, null);
  });

  it('leaves settled entries alone', () => {
    for (const status of ['uploaded', 'processing', 'ready', 'failed'] as const) {
      const settled = entry({ status, progress: 1 });
      assert.deepEqual(rehydrateEntry(settled), settled);
    }
  });

  it('brings a killed completion back as `uploaded`, never as `queued`', () => {
    const back = rehydrateEntry(
      entry({ status: 'completing', assetId: 'a1', uploadUrl: 'https://x/y', progress: 1 }),
    );
    assert.equal(back.status, 'uploaded');
    assert.equal(back.progress, 1);
    assert.equal(back.assetId, 'a1');
    assert.equal(
      slotAction(back, NOW),
      'complete-only',
      'a cold start must not re-upload a file whose bytes already landed',
    );
  });

  it('persists an `uploaded` entry through a round trip', () => {
    const restored = deserializeQueue(
      serializeQueue([entry({ id: 'a', status: 'uploaded', assetId: 'a1', progress: 1 })]),
      NOW,
    );
    assert.equal(restored.length, 1);
    assert.equal(restored[0].status, 'uploaded');
    assert.equal(restored[0].assetId, 'a1');
  });

  it('round-trips the video poster path', () => {
    const withPoster = entry({ posterUri: 'file:///docs/uploads/e1-poster.jpg', kind: 'video' });
    const restored = deserializeQueue(serializeQueue([withPoster]), NOW);
    assert.equal(restored[0].posterUri, 'file:///docs/uploads/e1-poster.jpg');
    // A record written before posters existed reads back as null, not undefined.
    assert.equal(parseEntry({ id: 'a', itemId: 'i', localUri: 'f', kind: 'image' })?.posterUri, null);
  });

  it('round-trips a queue and drops finished entries', () => {
    const entries = [
      entry({ id: 'a', status: 'queued' }),
      entry({ id: 'b', status: 'ready' }),
      entry({ id: 'c', status: 'uploading', progress: 0.5 }),
    ];
    const restored = deserializeQueue(serializeQueue(entries), NOW);
    assert.deepEqual(
      restored.map((e) => e.id),
      ['a', 'c'],
      'a finished entry is the server’s record, not ours',
    );
    assert.equal(restored[1].status, 'queued');
  });

  it('survives malformed storage instead of wedging the queue', () => {
    assert.deepEqual(deserializeQueue(null), []);
    assert.deepEqual(deserializeQueue(''), []);
    assert.deepEqual(deserializeQueue('{not json'), []);
    assert.deepEqual(deserializeQueue('{"a":1}'), [], 'not an array');
    // One bad record must not take the good one with it.
    const mixed = JSON.stringify([{ id: 'x' }, entry({ id: 'ok' })]);
    assert.deepEqual(
      deserializeQueue(mixed, NOW).map((e) => e.id),
      ['ok'],
    );
  });

  it('rejects a record it could not run and repairs one it can', () => {
    assert.equal(parseEntry(null), null);
    assert.equal(parseEntry({ id: 'a', itemId: 'i' }), null, 'no localUri');
    assert.equal(parseEntry({ id: 'a', itemId: 'i', localUri: 'f', kind: 'audio' }), null);

    const repaired = parseEntry({
      id: 'a',
      itemId: 'i',
      localUri: 'file:///f.jpg',
      kind: 'image',
      status: 'nonsense',
      progress: 42,
      attempts: -3,
      method: 'PATCH',
      provider: 'dropbox',
    });
    assert.ok(repaired);
    assert.equal(repaired.status, 'queued');
    assert.equal(repaired.progress, 1);
    assert.equal(repaired.attempts, 0);
    assert.equal(repaired.method, null);
    assert.equal(repaired.provider, null);
    assert.equal(repaired.role, 'content');
  });

  it('drops entries older than the TTL', () => {
    const stale = entry({ createdAt: NOW - QUEUE_ENTRY_TTL_MS - 1 });
    const fresh = entry({ id: 'fresh', createdAt: NOW - QUEUE_ENTRY_TTL_MS });
    const raw = JSON.stringify([stale, fresh]);
    assert.deepEqual(
      deserializeQueue(raw, NOW).map((e) => e.id),
      ['fresh'],
    );
  });
});

/* ================================================================== */
describe('publish-when-ready readiness', () => {
  it('is not eligible with an empty queue', () => {
    const r = readiness([]);
    assert.equal(r.canPublishWhenReady, false);
    assert.equal(r.allReady, false);
    assert.equal(r.progress, 0);
  });

  it('is eligible once every entry owns a server-side asset row', () => {
    const mid = readiness([
      entry({ id: 'a', assetId: 'a1', status: 'uploading', progress: 0.5 }),
      entry({ id: 'b', assetId: 'a2', status: 'processing' }),
    ]);
    assert.equal(mid.canPublishWhenReady, true);
    assert.equal(mid.allReady, false, 'nothing is ready yet');
    assert.equal(mid.progress, 0.75);
  });

  it('is not eligible while an entry has never been granted a slot', () => {
    const r = readiness([
      entry({ id: 'a', assetId: 'a1', status: 'processing' }),
      entry({ id: 'b', assetId: null, status: 'queued' }),
    ]);
    assert.equal(
      r.canPublishWhenReady,
      false,
      'the worker publishes off asset rows; an entry with none would be left behind',
    );
  });

  it('is not eligible with a hard failure', () => {
    const r = readiness([
      entry({ id: 'a', assetId: 'a1', status: 'ready' }),
      entry({ id: 'b', assetId: 'a2', status: 'failed' }),
    ]);
    assert.equal(r.canPublishWhenReady, false);
    assert.equal(r.failed, 1);
    assert.equal(r.ready, 1);
  });

  it('counts delivered-but-not-completed entries as fully uploaded', () => {
    const r = readiness([
      entry({ id: 'a', assetId: 'a1', status: 'uploaded' }),
      entry({ id: 'b', assetId: 'a2', status: 'completing' }),
    ]);
    assert.equal(r.progress, 1, 'the bytes are all there');
    assert.equal(r.pending, 2, 'but the item is not publishable yet');
    assert.equal(r.allReady, false);
    assert.equal(r.canPublishWhenReady, true);
  });

  it('reports allReady only when every entry is ready', () => {
    const all = readiness([
      entry({ id: 'a', assetId: 'a1', status: 'ready' }),
      entry({ id: 'b', assetId: 'a2', status: 'ready' }),
    ]);
    assert.equal(all.allReady, true);
    assert.equal(all.canPublishWhenReady, true);
    assert.equal(all.progress, 1);
  });

  it('scopes to one item', () => {
    const entries = [
      entry({ id: 'a', itemId: 'item-1', assetId: 'a1', status: 'ready' }),
      entry({ id: 'b', itemId: 'item-2', assetId: 'a2', status: 'failed' }),
    ];
    assert.equal(itemReadiness(entries, 'item-1').allReady, true);
    assert.equal(itemReadiness(entries, 'item-2').failed, 1);
    assert.equal(itemReadiness(entries, 'item-3').total, 0);
  });
});
