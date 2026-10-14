import { UserCheck, UserPlus } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import Colors from '@/constants/colors';
import { useFollowAction } from '@/hooks/social/useProfile';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import SocialButton from './SocialButton';

/**
 * Follow / Following on someone else's profile: one way, no approval, apart
 * from the friend button beside it. Following is gold; tapping "Following"
 * stops following.
 */
export default function FollowButton({ userId, following }: { userId: string; following: boolean }) {
  const { t } = useTranslation();
  const requireAuth = useRequireAuth();
  const action = useFollowAction(userId);

  const toggle = () => {
    if (!requireAuth({ href: `/user/${userId}`, mode: 'login' })) return;
    action.mutate(!following, { onError: () => Alert.alert(t('social.profile.followFailed')) });
  };

  return following ? (
    <SocialButton
      label={t('social.profile.following')}
      tone="outline"
      icon={<UserCheck size={16} color={Colors.text.primary} />}
      onPress={toggle}
      accessibilityHint={t('social.profile.unfollow')}
    />
  ) : (
    <SocialButton
      label={t('social.profile.follow')}
      tone="gold"
      icon={<UserPlus size={16} color={Colors.text.dark} strokeWidth={2.4} />}
      onPress={toggle}
    />
  );
}
