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

  it('a share taken back after a refund is money out', () => {
    assert.deepEqual(ledgerLine('revenue_share_reversal'), { incoming: false, labelKey: 'fanClubDashboard.shareReversal' });
  });

  it('a balance adjustment goes the way its amount does, under its own label', () => {
    assert.deepEqual(ledgerLine('adjustment', 25), { incoming: true, labelKey: 'fanClubDashboard.adjustment' });
    assert.deepEqual(ledgerLine('adjustment', -12.5), { incoming: false, labelKey: 'fanClubDashboard.adjustment' });
  });

  it('an unknown type is shown as going out, so money is never overstated', () => {
    assert.equal(ledgerLine('something_new').incoming, false);
  });
});
