/**
 * The post composer's settings (spec 2.1.0 §03): who a post is for, a feeling
 * or activity, and what an edit sends. Pure, so `node --test` covers it.
 *
 * The keys mirror backend services/postRules.js (AUDIENCES, FEELINGS), which
 * refuses anything else; the words come from community.compose in the
 * translation files.
 */

export const AUDIENCES = ['public', 'friends'] as const;
export type Audience = (typeof AUDIENCES)[number];

export interface Feeling {
  key: string;
  kind: 'feeling' | 'activity';
  emoji: string;
}

export const FEELINGS: readonly Feeling[] = [
  { key: 'happy', kind: 'feeling', emoji: '😀' },
  { key: 'excited', kind: 'feeling', emoji: '🤩' },
  { key: 'proud', kind: 'feeling', emoji: '😌' },
  { key: 'grateful', kind: 'feeling', emoji: '🙏' },
  { key: 'hopeful', kind: 'feeling', emoji: '🤞' },
  { key: 'nervous', kind: 'feeling', emoji: '😬' },
  { key: 'sad', kind: 'feeling', emoji: '😢' },
  { key: 'angry', kind: 'feeling', emoji: '😠' },
  { key: 'watching_match', kind: 'activity', emoji: '⚽' },
  { key: 'at_stadium', kind: 'activity', emoji: '🏟️' },
  { key: 'celebrating', kind: 'activity', emoji: '🎉' },
  { key: 'travelling', kind: 'activity', emoji: '✈️' },
];

/** The catalog entry for a stored key, or null for none or an unknown one. */
export function feelingOf(key: string | null | undefined): Feeling | null {
  return FEELINGS.find((f) => f.key === key) ?? null;
}

interface EditablePost {
  title?: string | null;
  body?: string | null;
  location_name?: string | null;
  audience?: Audience | null;
  feeling?: string | null;
  tagged?: { id: string }[] | null;
}

export interface ComposerDraft {
  title: string;
  body: string;
  /** The location field as typed; empty clears it. */
  location: string;
  audience: Audience;
  feeling: string | null;
  taggedIds: string[];
}

export interface EditPayload {
  title?: string;
  body?: string;
  location_name?: string | null;
  audience?: Audience;
  feeling?: string | null;
  tagged_user_ids?: string[];
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

/**
 * PATCH /posts/:id with only what changed. The server re-moderates a change
 * to what the post says and marks it edited, so sending an unchanged field
 * would do both for nothing.
 */
export function editPayload(original: EditablePost, draft: ComposerDraft): EditPayload {
  const out: EditPayload = {};
  const title = draft.title.trim();
  const body = draft.body.trim();
  const location = draft.location.trim() || null;
  if (title !== (original.title ?? '')) out.title = title;
  if (body !== (original.body ?? '')) out.body = body;
  if (location !== (original.location_name ?? null)) out.location_name = location;
  if (draft.audience !== (original.audience ?? 'public')) out.audience = draft.audience;
  if ((draft.feeling ?? null) !== (original.feeling ?? null)) out.feeling = draft.feeling ?? null;
  const before = (original.tagged ?? []).map((p) => p.id);
  if (!sameSet(before, draft.taggedIds)) out.tagged_user_ids = draft.taggedIds;
  return out;
}
