/**
 * The registration screen's status line (B6.1): the fan club desk approves or
 * rejects a registration with a club in the directory.
 *
 * Run with:  node --test utils/__tests__/registrationStatus.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { registrationStatusKey } from '../registrationStatus.core.ts';

describe('registrationStatus.core', () => {
  it('a registration with a club says where its application stands', () => {
    assert.equal(registrationStatusKey({ status: 'pending', fan_club_id: 'c1' }), 'registration.status.pending');
    assert.equal(registrationStatusKey({ status: 'approved', fan_club_id: 'c1' }), 'registration.status.approved');
    assert.equal(registrationStatusKey({ status: 'rejected', fan_club_id: 'c1' }), 'registration.status.rejected');
  });

  it('a club typed by hand has nothing to approve, so the old line stays', () => {
    assert.equal(registrationStatusKey({ status: 'pending', fan_club_id: null }), 'registration.alreadyRegistered');
  });

  it('an older backend that sends no status keeps the old line', () => {
    assert.equal(registrationStatusKey({ fan_club_id: 'c1' }), 'registration.alreadyRegistered');
    assert.equal(registrationStatusKey({ status: 'weird', fan_club_id: 'c1' }), 'registration.alreadyRegistered');
  });
});
