import * as Crypto from 'expo-crypto';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import SocialService from '@/services/SocialService';
import type { EmbedKind } from '@/types/social';
import { newClientId } from '@/utils/chat.core';
import { socialKeys } from './keys';

/**
 * "Send to a friend", to several at once (§16, §37, §38). One request; the
 * server opens or reuses each 1:1 conversation and reports per recipient.
 */
export function useShareToFriends() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { recipientIds: string[]; kind: EmbedKind; id: string; note?: string }) =>
      SocialService.share({
        recipient_ids: input.recipientIds,
        embed_kind: input.kind,
        embed_id: input.id,
        ...(input.note?.trim() ? { body: input.note.trim() } : {}),
        // Shorter than a message client id: the server suffixes it per recipient.
        client_id: newClientId(Date.now(), Crypto.randomUUID()).slice(0, 40),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: socialKeys.inbox('inbox') });
      void queryClient.invalidateQueries({ queryKey: socialKeys.inbox('requests') });
    },
  });
}
