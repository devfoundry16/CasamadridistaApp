/**
 * The app's daily visit report (the analytics funnel's Visitor step).
 *
 * Run with:  node --test utils/__tests__/appVisit.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { VISIT_EVERY_MS, shouldReportVisit, visitBody } from '../appVisit.core.ts';

describe('appVisit.core', () => {
  const now = Date.parse('2026-10-06T12:00:00Z');

  it('reports on first launch, then at most once a day', () => {
    assert.equal(shouldReportVisit(null, now), true);
    assert.equal(shouldReportVisit(new Date(now - 2 * 3600_000).toISOString(), now), false);
    assert.equal(shouldReportVisit(new Date(now - VISIT_EVERY_MS).toISOString(), now), true);
  });

  it('a stored time that cannot be read, or one in the future, reports again', () => {
    assert.equal(shouldReportVisit('not a date', now), true);
    assert.equal(shouldReportVisit(new Date(now + 3600_000).toISOString(), now), true);
  });

  it('sends the install id, platform and version, and nothing about the person or device', () => {
    const body = visitBody('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'ios', '2.2.0');
    assert.deepEqual(body, { anon_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', platform: 'ios', app_version: '2.2.0' });
    assert.deepEqual(visitBody('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'web', null), {
      anon_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', platform: null, app_version: null,
    });
  });
});
