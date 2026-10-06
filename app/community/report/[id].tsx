import React, { useEffect } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import ReportSheet from '@/components/Community/Moderation/ReportSheet';
import Colors from '@/constants/colors';
import { useUser } from '@/hooks/useUser';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function ReportPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const { user } = useUser();
  const requireAuth = useRequireAuth();

  // A deep link can land a guest here; reporting needs an account.
  useEffect(() => {
    if (!user?.id) requireAuth({ href: `/community/report/${id ?? ''}`, mode: 'login' });
  }, [user?.id, id, requireAuth]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ReportSheet
        visible={!!user?.id}
        postId={id}
        onClose={() => router.back()}
      />
    </>
  );
}
