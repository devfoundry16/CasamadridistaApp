/**
 * The squad screen's position groups, as pure logic. Zero imports, so
 * `utils/__tests__/squadGroups.test.mts` runs it under `node --test`.
 */

const GROUPS = [
  { key: 'goalkeepers', position: 'Goalkeeper' },
  { key: 'defenders', position: 'Defender' },
  { key: 'midfielders', position: 'Midfielder' },
  { key: 'forwards', position: 'Attacker' },
] as const;

export type SquadGroupKey = (typeof GROUPS)[number]['key'];

/**
 * The squad by position, in screen order, each player once by id. The data
 * provider has listed one player up to three times, which showed them
 * repeatedly and broke the list's keys. A player with no id cannot be opened
 * or keyed, so it is left out.
 */
export function squadGroups<P extends { id: number | null | undefined; position?: string | null }>(
  players: readonly P[] | null | undefined,
): { key: SquadGroupKey; players: P[] }[] {
  const seen = new Set<number>();
  const unique = (players ?? []).filter((p) => {
    if (p?.id == null || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
  return GROUPS.map((g) => ({ key: g.key, players: unique.filter((p) => p.position === g.position) }));
}
