import { useRouter } from 'expo-router';
import { Ban, Check, MessageCircle, UserMinus, UserPlus, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import Colors from '@/constants/colors';
import { useRelationshipAction } from '@/hooks/social/useProfile';
import { SocialApiError } from '@/services/SocialService';
import type { FriendAction, RelationshipState } from '@/types/social';
import { controlShape } from '@/utils/chat.core';
import ActionSheet from './ActionSheet';
import SocialButton from './SocialButton';

interface Props {
  userId: string;
  name: string;
  state: RelationshipState;
  canMessage: boolean;
  onMessage: () => void;
  /** Compact rows show only the primary control; the profile shows Message too. */
  compact?: boolean;
}

/**
 * The relationship control — it changes SHAPE with the relationship, not just
 * its label (design plan):
 *
 *   none              solid gold  "Add friend"
 *   request sent      muted outline "Requested" with a cancel ✕
 *   request received  splits in two: gold Accept · outline Decline
 *                     (the only state that asks a question)
 *   friends           quiet outline "Friends ✓" → Message / Remove / Block
 *   you blocked them  destructive outline "Blocked" → Unblock
 *
 * "They blocked you" never reaches here: the API answers not-found and the
 * screen renders the profile as not available.
 */
export default function RelationshipControl({ userId, name, state, canMessage, onMessage, compact = false }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const action = useRelationshipAction(userId);
  const [sheet, setSheet] = useState(false);
  const shape = controlShape(state);

  const run = (a: FriendAction) =>
    action.mutate(a, {
      onError: (error) =>
        Alert.alert(t('common.error'), t(`social.errors.${error instanceof SocialApiError ? error.code : 'network_error'}`, { defaultValue: t('social.errors.generic') })),
    });

  const confirm = (a: 'remove' | 'block') =>
    Alert.alert(t(`social.confirm.${a}Title`, { name }), t(`social.confirm.${a}Body`, { name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t(`social.actions.${a}`), style: 'destructive', onPress: () => run(a) },
    ]);

  const busy = action.isPending;
  const message = !compact && canMessage && shape !== 'blocking' ? (
    <SocialButton flex label={t('social.actions.message')} tone="outline" icon={<MessageCircle size={16} color={Colors.text.primary} />} onPress={onMessage} />
  ) : null;

  if (shape === 'self') {
    return (
      <View style={{ flexDirection: 'row' }}>
        <SocialButton flex label={t('social.actions.editProfile')} tone="outline" onPress={() => router.push('/account/profile')} />
      </View>
    );
  }

  if (shape === 'respond') {
    return (
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <SocialButton flex label={t('social.actions.accept')} tone="gold" icon={<Check size={16} color={Colors.text.dark} />} busy={busy} onPress={() => run('accept')} />
        <SocialButton flex label={t('social.actions.decline')} tone="outline" disabled={busy} onPress={() => run('decline')} />
      </View>
    );
  }

  const primary =
    shape === 'add' ? (
      <SocialButton flex label={t('social.actions.addFriend')} tone="gold" icon={<UserPlus size={16} color={Colors.text.dark} />} busy={busy} onPress={() => run('request')} />
    ) : shape === 'requested' ? (
      <SocialButton
        flex
        label={t('social.actions.requested')}
        tone="muted"
        icon={<X size={14} color={Colors.text.tertiary} />}
        busy={busy}
        accessibilityHint={t('social.actions.cancelRequestHint')}
        onPress={() => run('cancel')}
      />
    ) : shape === 'friends' ? (
      <SocialButton flex label={t('social.actions.friends')} tone="outline" icon={<Check size={16} color={Colors.darkGold} />} busy={busy} onPress={() => setSheet(true)} />
    ) : (
      <SocialButton flex label={t('social.actions.blocked')} tone="destructive" busy={busy} accessibilityHint={t('social.actions.unblockHint')} onPress={() => run('unblock')} />
    );

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {primary}
      {message}
      <ActionSheet
        visible={sheet}
        onClose={() => setSheet(false)}
        cancelLabel={t('common.cancel')}
        title={name}
        actions={[
          { key: 'message', label: t('social.actions.message'), icon: <MessageCircle size={20} color={Colors.darkGold} />, onPress: onMessage },
          { key: 'remove', label: t('social.actions.remove'), icon: <UserMinus size={20} color={Colors.darkGold} />, onPress: () => confirm('remove') },
          { key: 'block', label: t('social.actions.block'), icon: <Ban size={20} color={Colors.status.error} />, destructive: true, onPress: () => confirm('block') },
        ]}
      />
    </View>
  );
}
