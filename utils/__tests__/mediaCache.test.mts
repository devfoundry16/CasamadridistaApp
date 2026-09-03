/**
 * Pure-logic tests for the media cache walker.
 *
 * `mapMediaTree` is what makes an optimistic like show up on every cached copy
 * of an item at once, and its reference-preservation contract is what stops
 * that from re-rendering every unrelated screen. Both are invisible when broken.
 *
 * Run with:  node --test utils/__tests__/mediaCache.test.mts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { mapMediaTree } from '../../hooks/media/mediaTree.ts';

/** Minimal shape that satisfies the walker's `id` + `access_level` heuristic. */
const item = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  access_level: 'public',
  like_count: 0,
  liked_by_me: false,
  ...extra,
});

const like = (target: string) => (node: any) =>
  node.id === target ? { ...node, liked_by_me: true, like_count: node.like_count + 1 } : node;

describe('mapMediaTree', () => {
  it('patches a match inside a plain array', () => {
    const tree = [item('a'), item('b')];
    const next = mapMediaTree(tree, like('b')) as any[];
    assert.equal(next[1].liked_by_me, true);
    assert.equal(next[1].like_count, 1);
    assert.equal(next[0].liked_by_me, false);
  });

  it('reaches items nested in an infinite-query envelope', () => {
    const tree = {
      pages: [
        { items: [item('a')], nextCursor: 'x' },
        { items: [item('b'), item('c')], nextCursor: null },
      ],
    };
    const next = mapMediaTree(tree, like('c')) as any;
    assert.equal(next.pages[1].items[1].liked_by_me, true);
    assert.equal(next.pages[0].items[0].liked_by_me, false);
  });

  it('reaches every envelope the hub payload uses at once', () => {
    const tree = {
      featured: [item('a')],
      from_madrid_now: { match: { id: 1 }, items: [item('a')] },
      latest: [item('b')],
      stories: [{ id: 'g1', viewed: false, items: [item('a')] }],
    };
    const next = mapMediaTree(tree, like('a')) as any;
    assert.equal(next.featured[0].liked_by_me, true);
    assert.equal(next.from_madrid_now.items[0].liked_by_me, true);
    assert.equal(next.stories[0].items[0].liked_by_me, true);
    assert.equal(next.latest[0].liked_by_me, false);
  });

  it('returns the SAME reference when nothing matched', () => {
    // This is what keeps setQueryData from re-rendering untouched screens.
    const tree = { pages: [{ items: [item('a')] }] };
    assert.equal(mapMediaTree(tree, like('zzz')), tree);
  });

  it('preserves references on the branches that did not change', () => {
    const untouched = { items: [item('a')], nextCursor: 'x' };
    const tree = { pages: [untouched, { items: [item('b')] }] };
    const next = mapMediaTree(tree, like('b')) as any;
    assert.notEqual(next, tree);
    assert.equal(next.pages[0], untouched);
  });

  it('does not mutate the input', () => {
    const original = item('a');
    const tree = [original];
    mapMediaTree(tree, like('a'));
    assert.equal(original.liked_by_me, false);
    assert.equal(original.like_count, 0);
  });

  it('ignores objects that are not media items', () => {
    // A match ref has an id but no access_level, so it must be walked through,
    // not treated as an item.
    const tree = { match: { id: 'a', name: 'Real Madrid' }, items: [item('a')] };
    const next = mapMediaTree(tree, like('a')) as any;
    assert.equal(next.match.name, 'Real Madrid');
    assert.equal(next.match.liked_by_me, undefined);
    assert.equal(next.items[0].liked_by_me, true);
  });

  it('passes primitives and null straight through', () => {
    assert.equal(mapMediaTree(null, like('a')), null);
    assert.equal(mapMediaTree(undefined, like('a')), undefined);
    assert.equal(mapMediaTree(42, like('a')), 42);
    assert.equal(mapMediaTree('a', like('a')), 'a');
  });

  it('stops descending past the depth cap instead of recursing forever', () => {
    // 10 levels deep — past MAX_DEPTH (8) — so the item is left alone rather
    // than costing an unbounded walk.
    let deep: any = item('a');
    for (let i = 0; i < 10; i += 1) deep = { child: deep };
    const next = mapMediaTree(deep, like('a')) as any;
    let node = next;
    for (let i = 0; i < 10; i += 1) node = node.child;
    assert.equal(node.liked_by_me, false);
  });
});
