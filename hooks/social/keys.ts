/**
 * React Query keys for Casa Social. One root, so a sign-in or sign-out can drop
 * every relationship and conversation the previous account could see.
 */
export const socialKeys = {
  all: ['social'] as const,
  me: () => [...socialKeys.all, 'me'] as const,
  profile: (userId: string) => [...socialKeys.all, 'profile', userId] as const,
  search: (q: string, country: string | null, fanClubId: string | null) =>
    [...socialKeys.all, 'search', q, country, fanClubId] as const,
  friends: () => [...socialKeys.all, 'friends'] as const,
  requests: () => [...socialKeys.all, 'requests'] as const,
  suggestions: () => [...socialKeys.all, 'suggestions'] as const,
  blocked: () => [...socialKeys.all, 'blocked'] as const,
  inbox: (box: 'inbox' | 'requests') => [...socialKeys.all, 'inbox', box] as const,
  unread: () => [...socialKeys.all, 'unread'] as const,
  conversation: (id: string) => [...socialKeys.all, 'conversation', id] as const,
  username: (candidate: string) => [...socialKeys.all, 'username', candidate] as const,
};
