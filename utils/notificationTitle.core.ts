/**
 * Which translated title a social inbox row shows.
 *
 * Pure, so `node --test` can load it. The stored title is English for clients
 * that render it verbatim; the app rebuilds it from `data.type` and
 * `data.actor_name` in the reader's language. Null means "show the stored
 * title".
 */

/** Payload types whose title is rebuilt from `actor_name`. */
export const SOCIAL_TITLE_TYPES = [
  'friend_request',
  'friend_accept',
  'post_like',
  'post_comment',
  'mention',
  'tag',
  'story_mention',
] as const;

interface TitleData {
  type?: string | null;
  actor_name?: string | null;
  comment_id?: string | null;
  reply?: boolean | null;
}

export function socialTitleKey(data: TitleData | null | undefined): string | null {
  const type = data?.type;
  if (!type || !data?.actor_name || !(SOCIAL_TITLE_TYPES as readonly string[]).includes(type)) return null;
  // A mention made in a comment says so; one in the post itself does not. A
  // comment answering the recipient's own comment reads as a reply.
  const key =
    type === 'mention' && data.comment_id
      ? 'mention_comment'
      : type === 'post_comment' && data.reply === true
        ? 'post_comment_reply'
        : type;
  return `social.notifications.${key}`;
}
