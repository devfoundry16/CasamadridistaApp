/**
 * One line of a club's revenue list (fan_club_transactions). Pure.
 *
 * Money in: a revenue share, or a payout credited back after it was rejected
 * or cancelled. Anything else is shown as money out.
 */
const LINES: Record<string, { incoming: boolean; labelKey: string }> = {
  revenue_share: { incoming: true, labelKey: 'fanClubDashboard.revenueShare' },
  payout: { incoming: false, labelKey: 'fanClubDashboard.payout' },
  payout_reversal: { incoming: true, labelKey: 'fanClubDashboard.payoutReversal' },
  revenue_share_reversal: { incoming: false, labelKey: 'fanClubDashboard.shareReversal' },
};

export function ledgerLine(type: string): { incoming: boolean; labelKey: string } {
  return LINES[type] ?? { incoming: false, labelKey: 'fanClubDashboard.payout' };
}
