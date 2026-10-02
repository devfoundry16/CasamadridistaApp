/**
 * The arithmetic of a resumable (tus) video upload: which bytes go next, how
 * far along it is, and what the server's answers mean.
 *
 * Run with:  node --test utils/__tests__/tusUpload.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  TUS_CHUNK_BYTES,
  TUS_HEADERS,
  headSaysGone,
  isUploadGone,
  needsResumableSlot,
  nextChunk,
  readOffset,
  shouldUseTus,
  tusProgress,
} from '../tusUpload.core.ts';

const MIB = 1024 * 1024;

describe('chunk size', () => {
  it('is a multiple of 256 KiB and at least 5 MiB, as Cloudflare requires', () => {
    assert.equal(TUS_CHUNK_BYTES % (256 * 1024), 0);
    assert.ok(TUS_CHUNK_BYTES >= 5 * MIB);
  });
});

describe('nextChunk', () => {
  it('starts at the offset and takes one chunk', () => {
    assert.deepEqual(nextChunk(0, 30 * MIB), { position: 0, length: TUS_CHUNK_BYTES });
    assert.deepEqual(nextChunk(TUS_CHUNK_BYTES, 30 * MIB), {
      position: TUS_CHUNK_BYTES,
      length: TUS_CHUNK_BYTES,
    });
  });

  it('the last chunk is whatever is left', () => {
    const total = TUS_CHUNK_BYTES * 2 + 1234;
    assert.deepEqual(nextChunk(TUS_CHUNK_BYTES * 2, total), { position: TUS_CHUNK_BYTES * 2, length: 1234 });
  });

  it('nothing is left once the offset reaches the size', () => {
    assert.equal(nextChunk(30 * MIB, 30 * MIB), null);
    assert.equal(nextChunk(31 * MIB, 30 * MIB), null);
  });

  it('refuses an offset or a size that is not a usable number', () => {
    assert.equal(nextChunk(-1, 30 * MIB), null);
    assert.equal(nextChunk(Number.NaN, 30 * MIB), null);
    assert.equal(nextChunk(0, 0), null);
  });
});

describe('readOffset', () => {
  it('reads Upload-Offset whatever the header casing', () => {
    assert.equal(readOffset({ 'Upload-Offset': '8388608' }), 8388608);
    assert.equal(readOffset({ 'upload-offset': '0' }), 0);
    assert.equal(readOffset({ 'UPLOAD-OFFSET': '42' }), 42);
  });

  it('answers null when the header is missing or not a whole number', () => {
    assert.equal(readOffset({}), null);
    assert.equal(readOffset({ 'Upload-Offset': 'abc' }), null);
    assert.equal(readOffset({ 'Upload-Offset': '-5' }), null);
    assert.equal(readOffset(null), null);
  });
});

describe('tusProgress', () => {
  it('counts the bytes the server holds plus the part of this chunk already sent', () => {
    assert.equal(tusProgress(50, 25, 100), 0.75);
  });

  it('never runs past 1 and is 0 for a size it cannot divide by', () => {
    assert.equal(tusProgress(100, 50, 100), 1);
    assert.equal(tusProgress(10, 0, 0), 0);
  });
});

describe('isUploadGone', () => {
  it('404 and 410 mean the upload no longer exists and needs a new slot', () => {
    assert.equal(isUploadGone(404), true);
    assert.equal(isUploadGone(410), true);
  });

  it('anything else is a failure worth retrying against the same upload', () => {
    assert.equal(isUploadGone(500), false);
    assert.equal(isUploadGone(409), false);
    assert.equal(isUploadGone(204), false);
  });
});

describe('headSaysGone', () => {
  it('any client error on the offset check means the upload cannot be carried on', () => {
    for (const status of [400, 403, 404, 410, 412]) assert.equal(headSaysGone(status), true, String(status));
  });

  it('a locked or rate-limited upload is still there; so is a server error', () => {
    assert.equal(headSaysGone(423), false);
    assert.equal(headSaysGone(429), false);
    assert.equal(headSaysGone(503), false);
    assert.equal(headSaysGone(200), false);
  });
});

describe('shouldUseTus', () => {
  const big = { kind: 'video' as const, role: 'content' as const, sizeBytes: TUS_CHUNK_BYTES + 1 };

  it('the first attempt is one request, so it finishes with the app in the background', () => {
    assert.equal(shouldUseTus({ ...big, attempts: 0 }), false);
  });

  it('once an attempt has failed, a big video goes up in resumable chunks', () => {
    assert.equal(shouldUseTus({ ...big, attempts: 1 }), true);
    assert.equal(shouldUseTus({ ...big, attempts: 3 }), true);
  });

  it('a small clip, an unmeasured one, a photo or a cover is always one request', () => {
    assert.equal(shouldUseTus({ ...big, sizeBytes: TUS_CHUNK_BYTES, attempts: 2 }), false);
    assert.equal(shouldUseTus({ ...big, sizeBytes: null, attempts: 2 }), false);
    assert.equal(shouldUseTus({ ...big, kind: 'image', attempts: 2 }), false);
    assert.equal(shouldUseTus({ ...big, role: 'cover', attempts: 2 }), false);
  });
});

describe('needsResumableSlot', () => {
  const failed = { kind: 'video' as const, role: 'content' as const, sizeBytes: 60 * MIB, attempts: 1 };

  it('a one-shot slot is swapped for a resumable one after its first failure', () => {
    assert.equal(needsResumableSlot({ ...failed, transport: 'direct' }), true);
    assert.equal(needsResumableSlot({ ...failed, transport: null }), true);
  });

  it('an entry that is already resumable keeps its slot', () => {
    assert.equal(needsResumableSlot({ ...failed, transport: 'tus' }), false);
  });

  it('nothing changes before a failure, or for a file that never goes resumable', () => {
    assert.equal(needsResumableSlot({ ...failed, attempts: 0, transport: 'direct' }), false);
    assert.equal(needsResumableSlot({ ...failed, kind: 'image', transport: 'direct' }), false);
  });
});

describe('TUS_HEADERS', () => {
  it('names the protocol version every tus request must carry', () => {
    assert.equal(TUS_HEADERS['Tus-Resumable'], '1.0.0');
  });
});
