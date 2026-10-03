/**
 * The club's revenue list (B6.2): a payout credited back is money in.
 *
 * Run with:  node --test utils/__tests__/clubLedger.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ledgerLine } from '../clubLedger.core.ts';

describe('clubLedger.core', () => {
  it('revenue share and a credited-back payout come in; a payout goes out', () => {
    assert.deepEqual(ledgerLine('revenue_share'), { incoming: true, labelKey: 'fanClubDashboard.revenueShare' });
    assert.deepEqual(ledgerLine('payout'), { incoming: false, labelKey: 'fanClubDashboard.payout' });
    assert.deepEqual(ledgerLine('payout_reversal'), { incoming: true, labelKey: 'fanClubDashboard.payoutReversal' });
  });

  it('an unknown type is shown as going out, so money is never overstated', () => {
    assert.equal(ledgerLine('something_new').incoming, false);
  });
});
