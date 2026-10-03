/**
 * Appeals and warnings (admin §25) on the person's own screen.
 *
 * Run with:  node --test utils/__tests__/appeals.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { appealStatusKey, canAppealRestriction, canAppealWarning, safetyNoticeKey, statementProblem } from '../appeals.core.ts';

const open = (kind: string, id: string | null = null) => ({ id: 'a', subject_kind: kind, subject_id: id, status: 'open' });

describe('appeals.core', () => {
  it('a restricted person can appeal while the server says so and no appeal is open', () => {
    assert.equal(canAppealRestriction(true, []), true);
    assert.equal(canAppealRestriction(true, [open('restriction')]), false);
    assert.equal(canAppealRestriction(false, []), false);
  });

  it('an upheld appeal on the current restriction is not offered again (the server knows which restriction)', () => {
    // The server compares the appeal with when this restriction began; an
    // upheld appeal on an older restriction leaves it appealable.
    assert.equal(canAppealRestriction(false, [{ ...open('restriction'), status: 'upheld' }]), false);
    assert.equal(canAppealRestriction(true, [{ ...open('restriction'), status: 'upheld' }]), true);
  });

  it('a warning can be appealed while it stands and has no open appeal', () => {
    const warning = { id: 'w1', withdrawn_at: null };
    assert.equal(canAppealWarning(warning, []), true);
    assert.equal(canAppealWarning(warning, [open('warning', 'w1')]), false);
    assert.equal(canAppealWarning(warning, [open('warning', 'w2')]), true);
    assert.equal(canAppealWarning({ id: 'w1', withdrawn_at: '2026-10-01' }, []), false);
  });

  it('a warning whose appeal was upheld is not offered again', () => {
    const warning = { id: 'w1', withdrawn_at: null };
    assert.equal(canAppealWarning(warning, [{ ...open('warning', 'w1'), status: 'upheld' }]), false);
    assert.equal(canAppealWarning(warning, [{ ...open('warning', 'w2'), status: 'upheld' }]), true);
  });

  it('a safety notice is titled in the reader\'s language from its subtype', () => {
    assert.equal(safetyNoticeKey('warning'), 'appeals.notice.warning');
    assert.equal(safetyNoticeKey('appeal_overturned'), 'appeals.notice.appeal_overturned');
    assert.equal(safetyNoticeKey('appeal_upheld'), 'appeals.notice.appeal_upheld');
    // An older row without a subtype keeps its stored title.
    assert.equal(safetyNoticeKey(undefined), null);
    assert.equal(safetyNoticeKey('something_new'), null);
  });

  it('the statement must say something, within the limit the API keeps', () => {
    assert.equal(statementProblem('too short'), 'short');
    assert.equal(statementProblem('I was not the one who sent it.'), null);
    assert.equal(statementProblem('x'.repeat(2001)), 'long');
  });

  it('each status has its own message', () => {
    assert.equal(appealStatusKey('open'), 'appeals.status.open');
    assert.equal(appealStatusKey('upheld'), 'appeals.status.upheld');
    assert.equal(appealStatusKey('overturned'), 'appeals.status.overturned');
  });
});
