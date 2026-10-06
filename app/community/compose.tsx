import React, { useEffect } from 'react';
import Composer from '@/components/Community/Composer/Composer';
import { useUser } from '@/hooks/useUser';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function ComposePage() {
  const { user } = useUser();
  const requireAuth = useRequireAuth();

  // A deep link can land a guest here; the API would refuse the post.
  useEffect(() => {
    if (!user?.id) requireAuth({ href: '/community/compose', mode: 'login' });
  }, [user?.id, requireAuth]);

  return <Composer />;
}
