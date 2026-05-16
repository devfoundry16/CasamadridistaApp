import React from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import ReportSheet from '@/components/Community/Moderation/ReportSheet';
import Colors from '@/constants/colors';

export default function ReportPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ReportSheet
        visible
        postId={id}
        onClose={() => router.back()}
      />
    </>
  );
}
