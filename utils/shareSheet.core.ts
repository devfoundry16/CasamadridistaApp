/**
 * The post share sheet (spec 2.1.0 §04). Pure, so `node --test` can load it.
 */

export type OwnerTool = 'pin' | 'unpin' | 'insights' | 'edit';
export type ShareRow = 'friends' | 'copy_link' | 'share' | 'qr' | 'speed' | OwnerTool | 'save' | 'delete';

const OWNER_TOOLS: readonly string[] = ['pin', 'unpin', 'insights', 'edit'];

/**
 * The rows the sheet shows, in order: sending to people in the app, the ways
 * out of it (the link copied, the phone's share sheet, a QR code), the
 * playback speed for a video, then the author's own tools, kept apart from
 * the destinations (spec row 3). Someone else's post never gets an owner tool.
 *
 * `ownerTools` comes from the "..." menu's own rule (post.core
 * feedMenuActions), so the menu and the sheet always offer the same: Pin or
 * Unpin, Insights, Edit. Save and Delete stay the sheet's.
 *
 * A friends-only post has no public link: its /p/ page is anonymous, so it is
 * a 404 for everyone, friends included, and the outside ways are left out.
 * Sending it to a friend in the app still works (the server checks each
 * reader).
 *
 * @param saveable a photo or video post with something ready to save
 * @param isPublic false for a friends-only post
 */
export function shareSheetRows({
  isOwn,
  saveable,
  isPublic = true,
  isVideo = false,
  ownerTools = [],
}: {
  isOwn: boolean;
  saveable: boolean;
  isPublic?: boolean;
  isVideo?: boolean;
  ownerTools?: readonly string[];
}): ShareRow[] {
  const rows: ShareRow[] = isPublic ? ['friends', 'copy_link', 'share', 'qr'] : ['friends'];
  if (isVideo) rows.push('speed');
  if (isOwn) rows.push(...(ownerTools.filter((t) => OWNER_TOOLS.includes(t)) as OwnerTool[]));
  if (isOwn && saveable) rows.push('save');
  if (isOwn) rows.push('delete');
  return rows;
}

/**
 * Who "Send to" offers: friends first, then people the viewer follows who are
 * not already friends, each once, up to `max`.
 */
export function sendToPeople<P extends { id: string }>(
  friends: readonly P[] | null | undefined,
  following: readonly P[] | null | undefined,
  max = Infinity,
): P[] {
  const seen = new Set<string>();
  const out: P[] = [];
  for (const person of [...(friends ?? []), ...(following ?? [])]) {
    if (out.length >= max) break;
    if (!person?.id || seen.has(person.id)) continue;
    seen.add(person.id);
    out.push(person);
  }
  return out;
}

/**
 * Every item of a cursor-paged list, up to `max`. The friends list arrives 50
 * at a time; the friend picker searches all of them, not the first page.
 */
export async function collectPages<T>(
  fetchPage: (cursor: string | null) => Promise<{ items: T[]; next: string | null }>,
  max: number,
): Promise<T[]> {
  const all: T[] = [];
  let cursor: string | null = null;
  do {
    const page = await fetchPage(cursor);
    all.push(...page.items);
    cursor = page.next;
  } while (cursor && all.length < max);
  return all.slice(0, max);
}

interface SaveableMedia {
  id: string;
  kind: string;
  status: string;
  public_url: string | null;
  position?: number;
}

/**
 * What "Save to Photos" saves: every ready photo, in carousel order, and a
 * video only when it is a file. A stream (`.m3u8`, Cloudflare Stream) has no
 * single file to put in the library.
 */
export function saveableFiles(media: SaveableMedia[] | undefined): { id: string; url: string }[] {
  return [...(media ?? [])]
    .filter((m) => m.status === 'ready' && !!m.public_url)
    .filter((m) => m.kind === 'image' || (m.kind === 'video' && !/\.m3u8(\?|$)/i.test(m.public_url!)))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((m) => ({ id: m.id, url: m.public_url! }));
}
