/**
 * Uploading to a storage slot, and sizing Cloudflare image URLs.
 *
 * A slot says how its bytes go: Supabase takes a raw PUT, Cloudflare Images a
 * multipart POST with field `file`. The app tells the server it can do both
 * (`upload_methods`), so the server may hand it either.
 *
 * Run with:  node --test utils/__tests__/imageUpload.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { UPLOAD_METHODS, uploadPlan, isUploadIncomplete, retryWhileIncomplete } from '../uploadTarget.core.ts';
import { transformCover } from '../mediaUrl.core.ts';

describe('uploadTarget.core', () => {
  it('declares both methods to the server', () => {
    assert.deepEqual([...UPLOAD_METHODS], ['put', 'post']);
  });

  it('a slot with no method, or PUT, is a raw PUT with its content type', () => {
    for (const slot of [{}, { method: 'PUT' }, { method: 'put' }, { method: null }]) {
      assert.deepEqual(uploadPlan(slot, 'image/jpeg'), { kind: 'binary', httpMethod: 'PUT', headers: { 'Content-Type': 'image/jpeg' } });
    }
  });

  it('a POST slot is multipart, in the field the slot names (file by default)', () => {
    assert.deepEqual(uploadPlan({ method: 'POST', field: 'file' }, 'image/jpeg'), { kind: 'multipart', httpMethod: 'POST', fieldName: 'file', mimeType: 'image/jpeg' });
    assert.deepEqual(uploadPlan({ method: 'POST' }, 'image/png'), { kind: 'multipart', httpMethod: 'POST', fieldName: 'file', mimeType: 'image/png' });
  });

  it('knows the server\'s "not uploaded yet" answers', () => {
    for (const code of ['upload_incomplete', 'upload_missing', 'attachment_not_uploaded']) {
      assert.equal(isUploadIncomplete(new Error(code)), true, code);
      assert.equal(isUploadIncomplete({ code }), true, code);
    }
    assert.equal(isUploadIncomplete(new Error('Forbidden')), false);
    assert.equal(isUploadIncomplete(null), false);
  });

  it('retries a completion Cloudflare has not caught up with, then gives up', async () => {
    let calls = 0;
    const slept: number[] = [];
    const sleep = async (ms: number) => { slept.push(ms); };
    const out = await retryWhileIncomplete(async () => {
      calls += 1;
      if (calls < 3) throw new Error('upload_incomplete');
      return 'done';
    }, { tries: 3, delayMs: 500, sleep });
    assert.equal(out, 'done');
    assert.equal(calls, 3);
    assert.deepEqual(slept, [500, 1000]);

    calls = 0;
    await assert.rejects(retryWhileIncomplete(async () => { calls += 1; throw new Error('upload_incomplete'); }, { tries: 2, delayMs: 1, sleep }), /upload_incomplete/);
    assert.equal(calls, 2);

    calls = 0;
    await assert.rejects(retryWhileIncomplete(async () => { calls += 1; throw new Error('Forbidden'); }, { tries: 3, delayMs: 1, sleep }), /Forbidden/);
    assert.equal(calls, 1, 'any other error is not retried');
  });
});

describe('transformCover with Cloudflare Images', () => {
  const cf = 'https://imagedelivery.net/HASH/img-1/public';

  it('swaps the variant for the width, whether or not Supabase transforms are on', () => {
    assert.equal(transformCover(cf, 640, false), 'https://imagedelivery.net/HASH/img-1/w640');
    assert.equal(transformCover('https://imagedelivery.net/HASH/img-1/w1080', 320, true), 'https://imagedelivery.net/HASH/img-1/w320');
    assert.equal(transformCover(cf, 1600, false), 'https://imagedelivery.net/HASH/img-1/w1600');
  });

  it('never rewrites a signed URL: the signature covers the path', () => {
    const signed = 'https://imagedelivery.net/HASH/img-1/w1080?exp=1&sig=abc';
    assert.equal(transformCover(signed, 320, true), signed);
  });

  it('leaves a width outside the variants on the nearest one', () => {
    assert.equal(transformCover(cf, 1000, false), 'https://imagedelivery.net/HASH/img-1/w1080');
  });
});
