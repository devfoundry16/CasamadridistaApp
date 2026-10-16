/**
 * React Query keys for Casa Social. One root, so a sign-in or sign-out can drop
 * every relationship and conversation the previous account could see.
 */
export const socialKeys = {
  all: ['social'] as const,
  me: () => [...socialKeys.all, 'me'] as const,
  profile: (userId: string) => [...socialKeys.all, 'profile', userId] as const,
  profileGrid: (userId: string, tab: 'posts' | 'videos' | 'reels' | 'tagged' | 'media') => [...socialKeys.profile(userId), 'grid', tab] as const,
  /**
   * Your own saved posts, the Saved tab: all of them, or one collection's.
   * A collection's key starts with the whole list's, so invalidating saved()
   * refreshes every collection too.
   */
  saved: (collectionId?: string | null) =>
    (collectionId ? [...socialKeys.all, 'saved', collectionId] : [...socialKeys.all, 'saved']) as readonly string[],
  /** Your saved collections, with counts and covers. */
  savedCollections: () => [...socialKeys.all, 'savedCollections'] as const,
  /** Which of your collections hold one post. */
  postCollections: (postId: string) => [...socialKeys.all, 'savedCollections', 'post', postId] as const,
  search: (q: string, country: string | null, fanClubId: string | null) =>
    [...socialKeys.all, 'search', q, country, fanClubId] as const,
  friends: () => [...socialKeys.all, 'friends'] as const,
  /** The people you follow: Send to offers them after friends. */
  following: () => [...socialKeys.all, 'following'] as const,
  requests: () => [...socialKeys.all, 'requests'] as const,
  suggestions: () => [...socialKeys.all, 'suggestions'] as const,
  blocked: () => [...socialKeys.all, 'blocked'] as const,
  inbox: (box: 'inbox' | 'requests') => [...socialKeys.all, 'inbox', box] as const,
  unread: () => [...socialKeys.all, 'unread'] as const,
  conversation: (id: string) => [...socialKeys.all, 'conversation', id] as const,
  username: (candidate: string) => [...socialKeys.all, 'username', candidate] as const,
};
