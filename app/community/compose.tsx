import { useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import Composer from '@/components/Community/Composer/Composer';
import { useUser } from '@/hooks/useUser';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { composeStart } from '@/utils/createChooser.core';

export default function ComposePage() {
  const { user } = useUser();
  const requireAuth = useRequireAuth();
  // Create → Photo / Video opens straight on that picker.
  const { start } = useLocalSearchParams<{ start?: string }>();

  // A deep link can land a guest here; the API would refuse the post.
  useEffect(() => {
    if (!user?.id) requireAuth({ href: '/community/compose', mode: 'login' });
  }, [user?.id, requireAuth]);

  // Not for a guest: the login redirect comes first.
  return <Composer start={user?.id ? composeStart(start) : null} />;
}
