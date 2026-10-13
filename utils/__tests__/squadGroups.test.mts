/**
 * The squad screen's position groups. The data provider has listed one player
 * up to three times, which showed them repeatedly and broke the list's keys:
 * each player is placed once, by id.
 *
 * Run with:  node --test utils/__tests__/squadGroups.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { squadGroups } from '../squadGroups.core.ts';

const p = (id: number | null, position: string, name = `P${id}`) => ({ id, position, name });

describe('squadGroups', () => {
  it('groups by position in the screen order, each player once', () => {
    const groups = squadGroups([
      p(361497, 'Defender'), p(1, 'Goalkeeper'), p(1145, 'Defender'), p(361497, 'Defender'),
      p(762, 'Attacker'), p(5, 'Midfielder'), p(1145, 'Defender'),
    ]);
    assert.deepEqual(groups.map((g) => g.key), ['goalkeepers', 'defenders', 'midfielders', 'forwards']);
    assert.deepEqual(groups.map((g) => g.players.map((x) => x.id)), [[1], [361497, 1145], [5], [762]]);
  });

  it('a player with no id, or an unknown position, is left out; no squad is four empty groups', () => {
    const groups = squadGroups([p(null, 'Defender'), p(9, 'Coach')]);
    assert.equal(groups.every((g) => g.players.length === 0), true);
    assert.equal(squadGroups(undefined).length, 4);
  });
});
