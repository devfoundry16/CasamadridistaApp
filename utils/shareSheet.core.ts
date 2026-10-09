/**
 * The post share sheet (spec 2.1.0 §04). Pure, so `node --test` can load it.
 */

export type ShareRow = 'friends' | 'copy_link' | 'share' | 'qr' | 'save' | 'delete';

/**
 * The rows the sheet shows, in order: sending to friends in the app, the ways
 * out of it (the link copied, the phone's share sheet, a QR code), then the
 * author's own tools. Someone else's post never gets Save or Delete.
 *
 * @param saveable a photo or video post with something ready to save
 */
export function shareSheetRows({ isOwn, saveable }: { isOwn: boolean; saveable: boolean }): ShareRow[] {
  const rows: ShareRow[] = ['friends', 'copy_link', 'share', 'qr'];
  if (isOwn && saveable) rows.push('save');
  if (isOwn) rows.push('delete');
  return rows;
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
