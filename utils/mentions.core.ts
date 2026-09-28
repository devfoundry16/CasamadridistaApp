/**
 * The Community composer's @-autocomplete and "Tag people" helpers, and the
 * "with @a, @b" line under a post.
 *
 * Pure, with type-only imports, so `utils/__tests__/mentions.test.mts` runs it
 * under `node --test`.
 *
 * The mention rule is the tokenizer's (`richText.core.ts`): `@` not glued to a
 * word, then a handle of the username shape `^[a-z][a-z0-9_.]{2,19}$`. While
 * typing, a handle is still being written, so a prefix of that shape counts.
 */
import type { PersonCard } from '../types/social';

/** The backend's `tagged_user_ids` limit. */
export const TAG_MAX = 20;

/** The longest handle `usernameRules.js` allows. */
export const HANDLE_MAX = 20;

export interface Caret {
  start: number;
  end: number;
}

/** The `@word` being typed: `start` is the `@`, `end` the end of the word. */
export interface MentionRange {
  start: number;
  end: number;
  /** What has been typed after the `@`, up to the caret, lower-cased. */
  query: string;
}

const HANDLE_CHAR = /[A-Za-z0-9_.]/;
const WORD_CHAR = /[\p{L}\p{M}\p{N}_]/u;

/**
 * The `@word` the caret is in, or null.
 *
 * Only for a collapsed caret: with a range selected the person is not typing.
 * An `@` glued to a word (`ali@casa`) is an email address, and a handle starts
 * with a letter, so neither of those is offered suggestions.
 */
export function activeMention(text: string, selection: Caret): MentionRange | null {
  if (!text || selection.start !== selection.end) return null;
  const caret = Math.max(0, Math.min(selection.start, text.length));

  let left = caret;
  while (left > 0 && HANDLE_CHAR.test(text[left - 1])) left--;
  const start = left - 1;
  if (start < 0 || text[start] !== '@') return null;

  const before = start > 0 ? text[start - 1] : '';
  if (before && (WORD_CHAR.test(before) || before === '.' || before === '@')) return null;

  let end = caret;
  while (end < text.length && HANDLE_CHAR.test(text[end])) end++;

  if (end - start - 1 > HANDLE_MAX) return null;
  const query = text.slice(start + 1, caret).toLowerCase();
  if (query && !/^[a-z]/.test(query)) return null;

  return { start, end, query };
}

/**
 * Replace the `@word` with `@username` and a space, and say where the caret
 * goes: after the space, so the next word can be typed straight away. An
 * existing space after the word is reused rather than doubled; a newline is
 * not, or the caret would land on the next line.
 */
export function insertMention(text: string, range: MentionRange, username: string): { text: string; caret: number } {
  const handle = `@${username}`;
  const after = text.slice(range.end);
  const space = after.startsWith(' ') ? '' : ' ';
  return {
    text: text.slice(0, range.start) + handle + space + after,
    caret: range.start + handle.length + 1,
  };
}

type Candidate = PersonCard & { relationship?: string };

/** 0: handle starts with it, 1: a word of the name does, 2: either contains it, -1: no match. */
function rank(person: PersonCard, q: string): number {
  if (!q) return 0;
  const username = (person.username ?? '').toLowerCase();
  const name = person.name.toLowerCase();
  if (username.startsWith(q)) return 0;
  if (name.split(/\s+/).some((word) => word.startsWith(q))) return 1;
  if (username.includes(q) || name.includes(q)) return 2;
  return -1;
}

/**
 * Friends first, then search results, for a query typed after `@` or into the
 * "Tag people" search.
 *
 * Within each group the best matches lead: handle prefix, then a name word,
 * then anywhere. Search results drop yourself and people you block (the server
 * already hides people who block you), and anyone already listed as a friend.
 */
export function peopleMatching(
  query: string,
  friends: readonly PersonCard[],
  results: readonly Candidate[],
  options: { requireUsername?: boolean; exclude?: readonly string[]; limit?: number } = {},
): PersonCard[] {
  const q = query.trim().toLowerCase().replace(/^@+/, '');
  const exclude = new Set(options.exclude ?? []);
  const limit = options.limit ?? Infinity;
  const seen = new Set<string>();

  const pick = (people: readonly Candidate[], fromSearch: boolean): PersonCard[] =>
    people
      .map((person, index) => ({ person, index, score: rank(person, q) }))
      .filter(({ person, score }) => {
        if (score < 0 || exclude.has(person.id) || seen.has(person.id)) return false;
        if (options.requireUsername && !person.username) return false;
        if (fromSearch && (person.relationship === 'self' || person.relationship === 'blocking')) return false;
        return true;
      })
      .sort((a, b) => a.score - b.score || a.index - b.index)
      .map(({ person }) => {
        seen.add(person.id);
        return person;
      });

  return [...pick(friends, false), ...pick(results, true)].slice(0, limit);
}

/** Tag or untag a person. Adding stops at `max`; removing always works. */
export function toggleTagged<P extends { id: string }>(list: readonly P[], person: P, max = TAG_MAX): P[] {
  if (list.some((p) => p.id === person.id)) return list.filter((p) => p.id !== person.id);
  if (list.length >= max) return list as P[];
  return [...list, person];
}

/**
 * Who to name in "with @a, @b and 3 more". Three people are named in full:
 * "and 1 more" takes as much room as the name it hides.
 */
export function splitTagged<P>(tagged: readonly P[] | null | undefined, shown = 2): { shown: P[]; more: number } {
  const list = tagged ?? [];
  if (list.length <= shown + 1) return { shown: [...list], more: 0 };
  return { shown: list.slice(0, shown), more: list.length - shown };
}
