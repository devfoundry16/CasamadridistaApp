import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { listenerTokenOptions, shouldRegister } from '../pushRegistration.core.ts';

/**
 * Whether a push registration needs to reach the server again.
 *
 * The case this exists for: on a real iPhone the token listener fired over and
 * over, and every firing POSTed /api/notifications/devices — 20+ times a second,
 * which starved every other request the app made. Re-sending what the server
 * already holds must be a no-op.
 */
describe('shouldRegister', () => {
  const sent = { token: 'ExponentPushToken[a]', userId: 'u1', topicsKey: 'dm,social' };

  it('sends the first registration', () => {
    assert.equal(shouldRegister(null, sent), true);
  });

  it('does not send what the server already holds', () => {
    assert.equal(shouldRegister(sent, { ...sent }), false);
  });

  it('sends again when the token, the account or the topics change', () => {
    assert.equal(shouldRegister(sent, { ...sent, token: 'ExponentPushToken[b]' }), true);
    assert.equal(shouldRegister(sent, { ...sent, userId: null }), true, 'signed out: re-register anonymously');
    assert.equal(shouldRegister(sent, { ...sent, userId: 'u2' }), true);
    assert.equal(shouldRegister(sent, { ...sent, topicsKey: 'dm' }), true);
  });
});

describe('listenerTokenOptions', () => {
  it('hands the event\'s device token on, so the Expo token is not fetched by asking APNs again', () => {
    // Without devicePushToken, getExpoPushTokenAsync re-requests the APNs token,
    // which fires the token listener again: the loop this file exists for.
    const device = { type: 'ios', data: 'apns-token' };
    assert.deepEqual(listenerTokenOptions('project-1', device), { projectId: 'project-1', devicePushToken: device });
  });
});
