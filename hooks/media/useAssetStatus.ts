import { useQuery } from '@tanstack/react-query';

import ContributorMediaService from '@/services/ContributorMediaService';
import type { ContributorAsset } from '@/types/media/contributor';
import { contributorKeys } from './keys';

const POLL_MS = 3000;

/**
 * Poll one asset while it transcodes.
 *
 * Keyed per *asset*, not per item: a gallery can hold twenty of these and two
 * assets on the same item must not share a cache entry (that is exactly why
 * `contributorKeys.asset(itemId, assetId)` takes both).
 *
 * The interval is a function of the last result, so polling stops by itself the
 * moment the asset reaches a terminal state — no effect, no cleanup, nothing to
 * leak if the screen unmounts mid-transcode.
 */
export function useAssetStatus(
  itemId: string | undefined,
  assetId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: contributorKeys.asset(itemId ?? '', assetId ?? ''),
    queryFn: () => ContributorMediaService.getAsset(itemId as string, assetId as string),
    enabled: !!itemId && !!assetId && enabled,
    refetchInterval: (query) => {
      const data = query.state.data as ContributorAsset | undefined;
      if (!data) return POLL_MS;
      return data.status === 'ready' || data.status === 'failed' ? false : POLL_MS;
    },
    staleTime: 0,
    gcTime: 60_000,
  });
}

export function isAssetSettled(asset: ContributorAsset | undefined): boolean {
  return asset?.status === 'ready' || asset?.status === 'failed';
}
