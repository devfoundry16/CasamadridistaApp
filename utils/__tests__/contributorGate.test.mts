import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { gateState, showsContributorEntry } from '../contributorGate.core.ts';

/**
 * The contributor area's front door, as a decision.
 *
 * The case this exists for: an account that has been INVITED is refused by the
 * contributor API (403) exactly like a stranger is. Before the invitation flow
 * the app showed both the same "contributor access needed" screen, so an
 * invited correspondent had no way to say yes.
 */
describe('gateState', () => {
  const base = { signedIn: true, loading: false, me: null, error: null, invite: undefined } as const;

  it('asks a signed-out visitor to sign in before anything else', () => {
    assert.equal(gateState({ ...base, signedIn: false, loading: true }).kind, 'signedOut');
  });

  it('waits while the profile is loading', () => {
    assert.equal(gateState({ ...base, loading: true }).kind, 'loading');
  });

  it('lets an active contributor and a manager through', () => {
    assert.equal(gateState({ ...base, me: { contributor: { id: 'c' }, isMediaManager: false } }).kind, 'ready');
    assert.equal(gateState({ ...base, me: { contributor: null, isMediaManager: true } }).kind, 'ready');
  });

  it('offers the invitation to an account that was invited', () => {
    const state = gateState({
      ...base,
      error: { status: 403, message: 'Your contributor invitation has not been accepted yet' },
      invite: { status: 'invited', display_name: 'Lucía', invited_at: '2026-10-01T10:00:00Z' },
    });
    assert.equal(state.kind, 'invited');
  });

  it('waits for the invitation check before saying no', () => {
    // `undefined` is "not answered yet"; showing "access needed" for a moment
    // and then the invitation would be a flash of the wrong screen.
    const state = gateState({ ...base, error: { status: 403, message: 'no' }, invite: undefined });
    assert.equal(state.kind, 'loading');
  });

  it('shows the server\'s own sentence to an account with no open invitation', () => {
    const refused = { status: 403, message: 'Your contributor access is suspended' };
    for (const invite of [null, { status: 'suspended' }, { status: 'deactivated' }, { status: 'active' }]) {
      const state = gateState({ ...base, error: refused, invite: invite as never });
      assert.equal(state.kind, 'refused');
      assert.equal(state.kind === 'refused' && state.message, 'Your contributor access is suspended');
    }
  });

  it('says a closed staff session has ended, rather than offering a retry that cannot work', () => {
    // A manager's staff session closes after the idle or lifetime limit; the
    // token refresh keeps the same session, so only a new sign-in helps.
    const closed = { status: 401, message: 'session_revoked' };
    assert.equal(gateState({ ...base, error: closed, staffSessionClosed: true }).kind, 'sessionEnded');
    assert.equal(gateState({ ...base, error: closed, staffSessionClosed: false }).kind, 'failed');
  });

  it('treats a transport failure as retryable, not as a refusal', () => {
    assert.equal(gateState({ ...base, error: { message: 'Network Error' } }).kind, 'failed');
    assert.equal(gateState({ ...base, error: { status: 500, message: 'boom' } }).kind, 'failed');
  });

  it('refuses a payload that is neither a contributor nor a manager', () => {
    assert.equal(gateState({ ...base, me: { contributor: null, isMediaManager: false } }).kind, 'notContributor');
  });
});

describe('showsContributorEntry', () => {
  it('shows the account-tab entry to an invited account, so it can accept', () => {
    assert.equal(showsContributorEntry({ mediaContributor: { status: 'invited' } }), true);
    assert.equal(showsContributorEntry({ mediaContributor: { status: 'active' } }), true);
    assert.equal(showsContributorEntry({ mediaManager: true }), true);
  });

  it('hides it from everyone else', () => {
    assert.equal(showsContributorEntry({}), false);
    assert.equal(showsContributorEntry({ mediaContributor: null }), false);
    assert.equal(showsContributorEntry({ mediaContributor: { status: 'suspended' } }), false);
    assert.equal(showsContributorEntry({ mediaContributor: { status: 'deactivated' } }), false);
    assert.equal(showsContributorEntry(null), false);
  });
});
