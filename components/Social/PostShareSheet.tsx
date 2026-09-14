import { Send, Share2, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import type { Post } from '@/services/FeedService';
import PostService from '@/services/PostService';
import FriendPicker from './FriendPicker';
import T from './T';

interface Props {
  visible: boolean;
  post: Post;
  onClose: () => void;
}

/**
 * Community's share sheet (§16). Replaces the bare `Share.share` that
 * `PostActions` used to call, so a post can go to a friend inside the app as
 * well as out of it. Built from the Casa Media `ShareSheet` row recipe.
 */
export default function PostShareSheet({ visible, post, onClose }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const requireAuth = useRequireAuth();
  const [picker, setPicker] = useState(false);

  const toFriend = () => {
    onClose();
    if (!requireAuth({ href: `/community/post/${post.id}` })) return;
    setTimeout(() => setPicker(true), 320);
  };

  const elsewhere = async () => {
    onClose();
    try {
      await Share.share({
        message: post.body ?? t('social.share.postFallback'),
        url: `casamadridistaapp://community/post/${post.id}`,
      });
      await PostService.sharePost(post.id, 'native_share');
    } catch {
      // dismissed
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
        <Touchable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.cancel')} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
        <View
          accessibilityViewIsModal
          style={{ position: 'absolute', start: 0, end: 0, bottom: 0, backgroundColor: Colors.background.deepDark, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderTopWidth: 1, borderColor: Colors.border.default, paddingBottom: insets.bottom + 12 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
            <T step="headline" weight="bold" style={{ flex: 1 }}>
              {t('casaMedia.share')}
            </T>
            <Touchable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('common.cancel')}>
              <X size={20} color={Colors.text.tertiary} />
            </Touchable>
          </View>
          <Row icon={<Send size={20} color={Colors.darkGold} />} label={t('social.share.toFriend')} caption={t('social.share.toFriendCaption')} onPress={toFriend} />
          <Row icon={<Share2 size={20} color={Colors.darkGold} />} label={t('social.share.elsewhere')} onPress={elsewhere} last />
        </View>
      </Modal>
      <FriendPicker visible={picker} onClose={() => setPicker(false)} kind="post" id={post.id} subject={post.title ?? post.body} />
    </>
  );
}

/** The `Row` recipe from `components/Media/ShareSheet.tsx`, exactly. */
export function Row({ icon, label, caption, onPress, last = false }: { icon: React.ReactNode; label: string; caption?: string; onPress: () => void; last?: boolean }) {
  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: 16, borderBottomWidth: last ? 0 : 1, borderBottomColor: Colors.border.default },
        pressed && { backgroundColor: Colors.background.card },
      ]}
    >
      <View style={{ width: 28, alignItems: 'center' }}>{icon}</View>
      <View style={{ flex: 1, marginStart: 12 }}>
        <T step="body" weight="semibold">
          {label}
        </T>
        {caption ? (
          <T step="caption" color={Colors.text.tertiary} style={{ marginTop: 2 }}>
            {caption}
          </T>
        ) : null}
      </View>
    </Touchable>
  );
}
