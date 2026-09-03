import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dimensions, PixelRatio } from 'react-native';
import CasaMediaService from '@/services/CasaMediaService';
import type { MediaItem } from '@/types/media/casaMedia';
import { findCachedMediaItem } from './cache';
import { mediaKeys } from './keys';

/**
 * The width baked into the signed photo URLs. The server whitelists
 * 480/1080/2048 and defaults to 1080, so this only ever moves a phone up to
 * 2048 — and it is a device constant, which is why it stays out of the query
 * key: two builds on one device always ask for the same rung.
 */
const SIGNED_TARGET_PX = Math.round(
  Dimensions.get('window').width * Math.min(PixelRatio.get(), 3),
);

/**
 * One media item.
 *
 * Seeded from whatever rail/list already holds it so the cover is on screen on
 * frame 1 (same trick as PhotoViewerScreen). `initialDataUpdatedAt: 0` marks the
 * seed stale so a revalidation always runs — which matters more here than in the
 * feed, because a teaser cached while logged out must be replaced by the full
 * payload the moment the user signs in.
 */
export function useMediaItem(id: string | undefined) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: mediaKeys.item(id ?? ''),
    queryFn: () => CasaMediaService.getItem(id!, SIGNED_TARGET_PX),
    enabled: !!id,
    staleTime: 5 * 60_000,
    initialData: (): MediaItem | undefined =>
      id ? findCachedMediaItem(queryClient, id) : undefined,
    initialDataUpdatedAt: 0,
  });
}

/**
 * Short-lived signed playback URLs. Never cached beyond their own lifetime —
 * a stale token yields a 403 on the HLS manifest, which reads as a broken video.
 */
export function useMediaPlayback(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: mediaKeys.playback(id ?? ''),
    queryFn: () => CasaMediaService.getPlayback(id!, SIGNED_TARGET_PX),
    enabled: !!id && enabled,
    staleTime: 60_000,
    gcTime: 2 * 60_000,
    retry: 1,
  });
}
