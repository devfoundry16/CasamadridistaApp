/**
 * The Account "News by email" switch (admin §45).
 *
 * Run with:  node --test utils/__tests__/emailPreference.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseEmailPreference } from '../emailPreference.core.ts';

describe('emailPreference.core', () => {
  it('reads the server answer; anything else is unknown, not "on"', () => {
    assert.equal(parseEmailPreference({ marketing_emails: true }), true);
    assert.equal(parseEmailPreference({ marketing_emails: false }), false);
    assert.equal(parseEmailPreference({}), null);
    assert.equal(parseEmailPreference(null), null);
    assert.equal(parseEmailPreference({ marketing_emails: 'yes' }), null);
  });
});
