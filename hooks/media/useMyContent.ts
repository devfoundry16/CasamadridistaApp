import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import ContributorMediaService, {
  type ContributorItemQuery,
} from '@/services/ContributorMediaService';
import UploadManager from '@/services/upload/UploadManager';
import type {
  ContributorItem,
  ContributorItemInput,
  SubmitItemInput,
} from '@/types/media/contributor';
import { mediaKeys, contributorKeys } from './keys';

/** One page of the contributor's own items. */
export function useMyContent(query: ContributorItemQuery = {}) {
  return useQuery({
    queryKey: contributorKeys.itemList(query),
    queryFn: () => ContributorMediaService.listItems(query),
    staleTime: 30_000,
  });
}

export function useContributorItem(id: string | undefined) {
  return useQuery({
    queryKey: contributorKeys.item(id ?? ''),
    queryFn: () => ContributorMediaService.getItem(id as string),
    enabled: !!id,
    staleTime: 15_000,
  });
}

/**
 * Create / patch / submit / delete, each invalidating the same three places.
 *
 * `mediaKeys.all` is swept as well on publish: an item that just went live has
 * to appear on the consumer hub the contributor is about to open to check their
 * own work, and the hub's `staleTime` is a full minute.
 */
export function useContributorItemMutations() {
  const queryClient = useQueryClient();

  const invalidateLists = () => {
    // `itemLists()`, not `items()`: the latter is also a prefix of `item(id)`
    // and would refetch every open editor on every keystroke's autosave.
    void queryClient.invalidateQueries({ queryKey: contributorKeys.itemLists() });
    void queryClient.invalidateQueries({ queryKey: contributorKeys.stats() });
  };

  const setItem = (item: ContributorItem) => {
    queryClient.setQueryData(contributorKeys.item(item.id), item);
  };

  const create = useMutation({
    mutationFn: (input: ContributorItemInput) => ContributorMediaService.createItem(input),
    onSuccess: (item) => {
      setItem(item);
      invalidateLists();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ContributorItemInput }) =>
      ContributorMediaService.updateItem(id, patch),
    onSuccess: (item) => {
      setItem(item);
      invalidateLists();
    },
  });

  const submit = useMutation({
    mutationFn: ({ id, input }: { id: string; input: SubmitItemInput }) =>
      ContributorMediaService.submit(id, input),
    onSuccess: (item) => {
      setItem(item);
      invalidateLists();
      // Publishing changes what the consumer surfaces show.
      void queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => ContributorMediaService.deleteItem(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: contributorKeys.item(id) });
      // Local files and queue rows for a deleted draft are dead weight.
      void UploadManager.clearItem(id);
      invalidateLists();
      void queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });

  return { create, update, submit, remove };
}

/** Asset-level edits, which only ever affect one item's cache entry. */
export function useAssetMutations(itemId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidateItem = () => {
    if (itemId) void queryClient.invalidateQueries({ queryKey: contributorKeys.item(itemId) });
  };

  const reorder = useMutation({
    mutationFn: (assetIds: string[]) =>
      ContributorMediaService.reorderAssets(itemId as string, assetIds),
    onSuccess: invalidateItem,
  });

  const remove = useMutation({
    mutationFn: (assetId: string) =>
      ContributorMediaService.deleteAsset(itemId as string, assetId),
    onSuccess: invalidateItem,
  });

  const setCover = useMutation({
    mutationFn: (assetId: string) =>
      ContributorMediaService.setCoverFromAsset(itemId as string, assetId),
    onSuccess: invalidateItem,
  });

  return { reorder, remove, setCover };
}
