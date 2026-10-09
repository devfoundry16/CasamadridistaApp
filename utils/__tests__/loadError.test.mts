import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { httpStatusOf, isGone, loadError, retryUnlessGone } from '../loadError.core.ts';

/**
 * A screen that loads one thing (a Casa Media item) must tell "it is gone"
 * from "it did not load": the first shows "no longer available" and a way
 * back, the second offers Try again. Retrying a 404 only makes the spinner
 * last longer.
 */
describe('httpStatusOf', () => {
  it('reads the status a service attached, or an axios response', () => {
    assert.equal(httpStatusOf({ status: 404 }), 404);
    assert.equal(httpStatusOf({ response: { status: 410 } }), 410);
    assert.equal(httpStatusOf(new Error('offline')), null);
    assert.equal(httpStatusOf(null), null);
  });
});

describe('isGone', () => {
  it('404 and 410 mean the thing no longer exists', () => {
    assert.equal(isGone({ status: 404 }), true);
    assert.equal(isGone({ response: { status: 410 } }), true);
  });
  it('a server error or no response at all is a failure to load, not gone', () => {
    assert.equal(isGone({ status: 500 }), false);
    assert.equal(isGone(new Error('Network Error')), false);
  });
});

describe('retryUnlessGone', () => {
  it('never retries something that is gone', () => {
    assert.equal(retryUnlessGone(0, { status: 404 }), false);
  });
  it('retries other failures up to three times', () => {
    assert.equal(retryUnlessGone(0, new Error('offline')), true);
    assert.equal(retryUnlessGone(2, { status: 503 }), true);
    assert.equal(retryUnlessGone(3, { status: 503 }), false);
  });
});

describe('loadError', () => {
  it('a service error built from an axios 404 keeps the server message and reads as gone', () => {
    const err = loadError({ response: { status: 404, data: { error: 'Not found' } } }, 'Failed to load this item');
    assert.ok(err instanceof Error);
    assert.equal(err.message, 'Not found');
    assert.equal(isGone(err), true);
  });
  it('no response: the fallback message, and no status at all', () => {
    const err = loadError(new Error('Network Error'), 'Failed to load this item');
    assert.equal(err.message, 'Failed to load this item');
    assert.equal('status' in err, false);
    assert.equal(isGone(err), false);
  });
});
