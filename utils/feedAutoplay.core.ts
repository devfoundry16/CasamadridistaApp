/**
 * Which feed video plays.
 *
 * One player per screen (components/Media/Video/MediaVideoPlayer.tsx, plan
 * §5.8): the feed mounts a player only for the post this picks, and every
 * other card shows its poster. Pure, so `node --test` can load it.
 */

interface MediaLike {
  kind?: string;
  status?: string;
  hls_url?: string | null;
  public_url?: string | null;
}

interface PostLike {
  id: string;
  kind?: string;
  media?: MediaLike[];
}

/** The URL a video plays from: the stream when there is one, else the file. */
export function playableUri(media: Pick<MediaLike, 'hls_url' | 'public_url'>): string | null {
  return media.hls_url || media.public_url || null;
}

/** A post whose single video is ready to play. Video posts never mix in photos. */
function readyVideo(post: PostLike | undefined): boolean {
  const media = post?.media?.[0];
  return (
    post?.kind === 'video' &&
    media?.kind === 'video' &&
    media.status === 'ready' &&
    playableUri(media) !== null
  );
}

/**
 * The id of the post to play: the first ready video among the items the list
 * reports as viewable, in list order. Null when there is none.
 */
export function pickActiveVideo(viewable: { item: unknown; isViewable: boolean }[]): string | null {
  for (const v of viewable) {
    const post = v.item as PostLike | undefined;
    if (v.isViewable && readyVideo(post)) return post!.id;
  }
  return null;
}

/** The ready video posts of every loaded feed page, in order, each once. */
export function videoPostsOf<T extends PostLike>(pages: { posts: T[] }[] | undefined): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const page of pages ?? []) {
    for (const post of page.posts) {
      if (seen.has(post.id) || !readyVideo(post)) continue;
      seen.add(post.id);
      out.push(post);
    }
  }
  return out;
}

const FEED_TABS = ['for-you', 'trending', 'recent', 'fan-clubs', 'reels'] as const;
export type FeedTabName = (typeof FEED_TABS)[number];

/** The viewer's `feed` link param as a feed tab, or null to open the one post. */
export function feedTabOf(param: string | string[] | undefined): FeedTabName | null {
  const value = Array.isArray(param) ? param[0] : param;
  return (FEED_TABS as readonly string[]).includes(value ?? '') ? (value as FeedTabName) : null;
}

/**
 * The page of the open video in the viewer's list: by id, so a refreshed or
 * reordered feed keeps showing the same post. A post that left the list falls
 * back to the first page; an empty list is -1.
 */
export function viewerIndex(videos: { id: string }[], openId: string): number {
  if (!videos.length) return -1;
  const at = videos.findIndex((v) => v.id === openId);
  return at === -1 ? 0 : at;
}
