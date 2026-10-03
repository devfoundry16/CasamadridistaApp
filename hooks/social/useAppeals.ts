import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import SocialService from '@/services/SocialService';
import type { MyAppeal } from '@/types/social';
import { socialKeys } from './keys';

const appealsKey = [...socialKeys.all, 'appeals'] as const;
const warningsKey = [...socialKeys.all, 'warnings'] as const;

/** Your appeals and whether the account is restricted (admin §25). */
export function useMyAppeals() {
  return useQuery({ queryKey: appealsKey, queryFn: () => SocialService.myAppeals(), staleTime: 30_000 });
}

export function useMyWarnings() {
  return useQuery({ queryKey: warningsKey, queryFn: () => SocialService.myWarnings(), staleTime: 30_000 });
}

export function useFileAppeal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { subject_kind: MyAppeal['subject_kind']; subject_id?: string | null; statement: string }) =>
      SocialService.appeal(input),
    onSuccess: () => client.invalidateQueries({ queryKey: appealsKey }),
  });
}
