/**
 * Saved collections: named folders for the posts you save, private to you
 * (backend savedCollectionRules). A post in a collection is always saved;
 * unsaving it takes it out of all of them; deleting a collection keeps its
 * posts saved. Zero imports, so `utils/__tests__/savedCollections.test.mts`
 * runs it under `node --test`.
 */

export const COLLECTION_NAME_MAX = 40;

export interface SavedCollection {
  id: string;
  name: string;
  /** Live posts in it. */
  post_count: number;
  /** The thumbnail of its newest post you may still see, or null. */
  cover_url: string | null;
}

/** Why a name would be refused, or null: 1–40 characters once trimmed. */
export function collectionNameProblem(name: string): 'invalid_name' | null {
  const trimmed = name.trim();
  return trimmed && trimmed.length <= COLLECTION_NAME_MAX ? null : 'invalid_name';
}

/** GET /posts/saved/collections, folded into safe values; anything malformed is dropped. */
export function normaliseCollections(raw: unknown): SavedCollection[] {
  const list = (raw as { collections?: unknown })?.collections;
  if (!Array.isArray(list)) return [];
  const out: SavedCollection[] = [];
  for (const c of list) {
    if (!c || typeof c.id !== 'string' || typeof c.name !== 'string') continue;
    const count = typeof c.post_count === 'number' && c.post_count > 0 ? Math.floor(c.post_count) : 0;
    out.push({ id: c.id, name: c.name, post_count: count, cover_url: typeof c.cover_url === 'string' ? c.cover_url : null });
  }
  return out;
}

/** The picker's next set of ticked collections. */
export function toggleCollection(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

/** The message key for a refused change, from the server's error code. */
export function collectionErrorKey(code: string | null | undefined): string {
  if (code === 'name_taken') return 'social.collections.nameTaken';
  if (code === 'collection_limit') return 'social.collections.limit';
  if (code === 'invalid_name') return 'social.collections.invalidName';
  return 'social.collections.failed';
}
