/**
 * Recognising the backend's maintenance refusal: a 503 whose JSON body says
 * `maintenance: true`. Anything else that looks like an outage — a proxy's
 * HTML error page, a crashed server, a timeout — must NOT put the app behind
 * the maintenance screen, or a blip would lock everyone out.
 *
 * Run with:  node --test utils/__tests__/maintenance.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  MaintenanceError,
  NO_MAINTENANCE,
  maintenanceAfterFailure,
  readMaintenance,
} from '../maintenance.core.ts';

const REFUSAL = {
  error: 'Casa Madridista is under maintenance. Please try again later.',
  maintenance: true,
  message: 'Casa Madridista is under maintenance. Please try again later.',
};

describe('readMaintenance', () => {
  it('recognises the backend refusal and carries its message', () => {
    assert.deepEqual(readMaintenance(503, REFUSAL), { message: REFUSAL.message });
  });

  it('accepts the body as raw text, the way fetch hands it over', () => {
    assert.deepEqual(readMaintenance(503, JSON.stringify(REFUSAL)), { message: REFUSAL.message });
  });

  it('has no message when the server sent none worth showing', () => {
    for (const message of [undefined, null, '', '   ', 42, {}, ['x']]) {
      assert.deepEqual(readMaintenance(503, { maintenance: true, message }), { message: null });
    }
  });

  it('trims the message', () => {
    assert.deepEqual(readMaintenance(503, { maintenance: true, message: '  Back at 18:00.  ' }), {
      message: 'Back at 18:00.',
    });
  });

  it('ignores a 503 that is not our refusal', () => {
    const notOurs = [
      { error: 'Service Unavailable' },
      { maintenance: false, message: 'x' },
      { maintenance: 'true' },
      { maintenance: 1 },
      {},
      null,
      undefined,
      [],
      [{ maintenance: true }],
      42,
      '<html><body>503 Service Temporarily Unavailable</body></html>',
      '',
      'null',
      '"maintenance"',
      '{"maintenance":tru',
    ];
    for (const body of notOurs) {
      assert.equal(readMaintenance(503, body), null, JSON.stringify(body));
    }
  });

  it('ignores the flag on any status other than 503', () => {
    for (const status of [200, 204, 400, 401, 404, 500, 502, 504, 0, NaN]) {
      assert.equal(readMaintenance(status, REFUSAL), null, String(status));
    }
  });
});

describe('MaintenanceError', () => {
  it('is an Error that carries the notice', () => {
    const error = new MaintenanceError({ message: 'Back at 18:00.' });
    assert.ok(error instanceof Error);
    assert.ok(error instanceof MaintenanceError);
    assert.equal(error.name, 'MaintenanceError');
    assert.deepEqual(error.notice, { message: 'Back at 18:00.' });
  });

  it('has a readable message even when the server sent none', () => {
    assert.equal(new MaintenanceError({ message: null }).message, 'Service is under maintenance');
    assert.equal(new MaintenanceError({ message: 'Back at 18:00.' }).message, 'Back at 18:00.');
  });
});

describe('maintenanceAfterFailure', () => {
  const ACTIVE = { active: true, message: 'Back at 18:00.' };

  it('a refusal starts maintenance, or updates its message', () => {
    assert.deepEqual(maintenanceAfterFailure(NO_MAINTENANCE, new MaintenanceError({ message: null })), {
      active: true,
      message: null,
    });
    assert.deepEqual(maintenanceAfterFailure(ACTIVE, new MaintenanceError({ message: 'Back at 20:00.' })), {
      active: true,
      message: 'Back at 20:00.',
    });
  });

  it('any other failure leaves the state as it was', () => {
    // Offline is not maintenance, and a failed retry is not proof it is over.
    for (const error of [new Error('Network request failed'), new TypeError('x'), 'boom', undefined, null, {}]) {
      assert.deepEqual(maintenanceAfterFailure(NO_MAINTENANCE, error), NO_MAINTENANCE);
      assert.deepEqual(maintenanceAfterFailure(ACTIVE, error), ACTIVE);
    }
  });

  it('the resting state is inactive with no message', () => {
    assert.deepEqual(NO_MAINTENANCE, { active: false, message: null });
  });
});
