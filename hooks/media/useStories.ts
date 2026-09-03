import { useQuery } from '@tanstack/react-query';
import CasaMediaService from '@/services/CasaMediaService';
import { mediaKeys } from './keys';

/**
 * The story rail's bubbles.
 *
 * `GET /stories` is a flat `{ items, nextCursor }` of story teasers — there is
 * no group on the server — so `CasaMediaService.getStories` groups them by
 * fixture. `viewed` per *item* does come from the server, which is why a group
 * marked viewed stays viewed across devices and reinstalls.
 *
 * Short staleTime: a story expiring while the rail is on screen should
 * disappear on the next focus, not linger for minutes.
 */
export function useStories() {
  return useQuery({
    queryKey: mediaKeys.stories(),
    queryFn: () => CasaMediaService.getStories(),
    staleTime: 60_000,
  });
}
