/**
 * Staff refusals from the API (admin §51) as the mobile admin screen shows them.
 *
 * Run with:  node --test utils/__tests__/staffRefusal.test.mts
 *
 * The API now refuses a staff request whose session has ended (401
 * session_idle / session_revoked), one that needs a recent sign-in (403
 * reauth_required), one without a second factor when it is required (403
 * mfa_required) and a money decision without the finance permission. Each
 * gets a sentence the admin can act on instead of "failed".
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isStaffSessionRefusal, staffRefusalKey } from '../staffRefusal.core.ts';

const err = (status: number, error: string) => ({ response: { status, data: { error } } });

describe('staffRefusal.core', () => {
  it('maps each refusal to its message key', () => {
    assert.equal(staffRefusalKey(err(401, 'session_idle')), 'admin.refusal.sessionEnded');
    assert.equal(staffRefusalKey(err(401, 'session_revoked')), 'admin.refusal.sessionEnded');
    assert.equal(staffRefusalKey(err(403, 'reauth_required')), 'admin.refusal.reauth');
    assert.equal(staffRefusalKey(err(403, 'mfa_required')), 'admin.refusal.mfa');
    assert.equal(staffRefusalKey(err(403, 'finance_permission_required')), 'admin.refusal.finance');
  });

  it('leaves every other error to the screen', () => {
    assert.equal(staffRefusalKey(err(403, 'forbidden')), null);
    assert.equal(staffRefusalKey(err(500, 'boom')), null);
    assert.equal(staffRefusalKey(new Error('network')), null);
    assert.equal(staffRefusalKey(null), null);
  });

  it('a closed staff session is not a token problem: refreshing cannot fix it', () => {
    assert.equal(isStaffSessionRefusal(401, 'session_idle'), true);
    assert.equal(isStaffSessionRefusal(401, 'session_revoked'), true);
    assert.equal(isStaffSessionRefusal(401, 'Invalid or expired token'), false);
    assert.equal(isStaffSessionRefusal(403, 'session_idle'), false);
  });
});
