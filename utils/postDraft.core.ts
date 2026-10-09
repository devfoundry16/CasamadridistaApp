/**
 * A new post in progress, kept on the phone so closing the composer (or the
 * app) does not lose it. One draft per account. Pure, so `node --test` covers
 * it; the storage and the file copies are in utils/postDraft.ts.
 *
 * Media is stored as copies under the app's documents folder: a picked file
 * lives in the cache, which iOS may clear between launches.
 */

export const DRAFT_VERSION = 1;

export interface DraftMedia {
  uri: string;
  kind: 'image' | 'video';
  mime: string;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  sizeBytes: number | null;
  thumbnailUri?: string;
}

export interface DraftPerson {
  id: string;
  name: string;
  username?: string | null;
  avatar_url?: string | null;
}

export interface PostDraft {
  v: number;
  savedAt: string;
  title: string;
  body: string;
  location: string;
  audience: 'public' | 'friends';
  feeling: string | null;
  tagged: DraftPerson[];
  /** The picker's own rows, kept whole so they show again as picked. */
  country: { country: string; country_code: string | null } | null;
  fanClub: Record<string, unknown> | null;
  postAsFanClub: boolean;
  media: DraftMedia[];
  /** A poll being written: its option texts as typed, and its length in days. */
  poll?: { options: string[]; days: number } | null;
  /** Reel mode: one vertical video, posted as format 'reel'. */
  reel?: boolean;
}

export function draftKey(userId: string): string {
  return `casa_post_draft:${userId}`;
}

export function serializeDraft(draft: PostDraft, now: Date = new Date()): string {
  return JSON.stringify({ ...draft, v: DRAFT_VERSION, savedAt: now.toISOString() });
}

const isStr = (v: unknown): v is string => typeof v === 'string';
const numOrNull = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

function mediaOf(value: unknown): DraftMedia[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((m) => m && isStr(m.uri) && m.uri && (m.kind === 'image' || m.kind === 'video'))
    .map((m) => ({
      uri: m.uri,
      kind: m.kind,
      mime: isStr(m.mime) ? m.mime : m.kind === 'image' ? 'image/jpeg' : 'video/mp4',
      width: numOrNull(m.width),
      height: numOrNull(m.height),
      durationMs: numOrNull(m.durationMs),
      sizeBytes: numOrNull(m.sizeBytes),
      ...(isStr(m.thumbnailUri) ? { thumbnailUri: m.thumbnailUri } : {}),
    }));
}

/** A stored draft, checked; null for nothing, junk, or another version. */
export function parseDraft(raw: string | null | undefined): PostDraft | null {
  if (!raw) return null;
  let d: any;
  try {
    d = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!d || d.v !== DRAFT_VERSION) return null;
  if (!isStr(d.title) || !isStr(d.body) || !isStr(d.location)) return null;
  return {
    v: DRAFT_VERSION,
    savedAt: isStr(d.savedAt) ? d.savedAt : new Date(0).toISOString(),
    title: d.title,
    body: d.body,
    location: d.location,
    audience: d.audience === 'friends' ? 'friends' : 'public',
    feeling: isStr(d.feeling) ? d.feeling : null,
    tagged: Array.isArray(d.tagged) ? d.tagged.filter((p: any) => p && isStr(p.id) && isStr(p.name)) : [],
    country: d.country && isStr(d.country.country) ? d.country : null,
    fanClub: d.fanClub && isStr(d.fanClub.id) ? d.fanClub : null,
    postAsFanClub: d.postAsFanClub === true,
    media: mediaOf(d.media),
    poll:
      d.poll && Array.isArray(d.poll.options) && d.poll.options.every(isStr) && typeof d.poll.days === 'number'
        ? { options: d.poll.options, days: d.poll.days }
        : null,
    reel: d.reel === true,
  };
}

/** Nothing typed, picked or chosen: not worth keeping. */
export function isDraftEmpty(d: PostDraft): boolean {
  return (
    !d.title.trim() &&
    !d.body.trim() &&
    !d.location.trim() &&
    !d.feeling &&
    d.tagged.length === 0 &&
    d.media.length === 0 &&
    !d.country &&
    !d.fanClub &&
    !(d.poll?.options ?? []).some((o) => o.trim())
  );
}

/**
 * The files in the draft's folder (`names`, as listed) that the draft no
 * longer points at: a photo removed while drafting. Deleted after each save,
 * so the folder holds only what the draft uses.
 */
export function unreferencedFiles(names: string[], dir: string, d: PostDraft): string[] {
  const used = new Set(d.media.flatMap((m) => [m.uri, m.thumbnailUri].filter(Boolean) as string[]));
  return names.filter((n) => !used.has(dir + n));
}
