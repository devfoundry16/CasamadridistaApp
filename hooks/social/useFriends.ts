import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useUser } from '@/hooks/useUser';
import SocialService from '@/services/SocialService';
import { socialKeys } from './keys';

export function useFriends() {
  const { user } = useUser();
  return useQuery({
    queryKey: socialKeys.friends(),
    queryFn: async () => (await SocialService.friends()).friends,
    enabled: !!user?.id,
    staleTime: 60_000,
  });
}

export function useFriendRequests() {
  const { user } = useUser();
  return useQuery({
    queryKey: socialKeys.requests(),
    queryFn: () => SocialService.requests(),
    enabled: !!user?.id,
    staleTime: 30_000,
  });
}

export function useSuggestions() {
  const { user } = useUser();
  return useQuery({
    queryKey: socialKeys.suggestions(),
    queryFn: () => SocialService.suggestions(),
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
  });
}

export function useBlocked(enabled = true) {
  const { user } = useUser();
  return useQuery({
    queryKey: socialKeys.blocked(),
    queryFn: () => SocialService.blocked(),
    enabled: enabled && !!user?.id,
  });
}

/** Debounced value — one search request per pause in typing, not per key. */
export function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

/** People search by name or @username, narrowed by country and fan club (§21). */
export function useUserSearch(query: string, country: string | null, fanClubId: string | null) {
  const { user } = useUser();
  const q = useDebounced(query.trim());
  const active = q.replace(/^@+/, '').length >= 2 || !!country || !!fanClubId;
  return useQuery({
    queryKey: socialKeys.search(q, country, fanClubId),
    queryFn: () => SocialService.search({ q, country, fan_club_id: fanClubId }),
    enabled: !!user?.id && active,
    staleTime: 30_000,
  });
}
