import { Image } from 'expo-image';
import { Play, X } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import PostBody from '@/components/Community/PostCard/PostBody';
import PostHeader from '@/components/Community/PostCard/PostHeader';
import T from '@/components/Social/T';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import type { Post } from '@/services/FeedService';
import type { PickedMedia } from './MediaPicker';

interface Props {
  visible: boolean;
  post: Post;
  /** New media picked in the composer (not yet uploaded). */
  media: PickedMedia[];
  submitting: boolean;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * How the post will look in the feed, before it goes out: the same header and
 * body a feed card uses, with the picked photos or video. Nothing is sent
 * until "Post" (or "Save") is tapped here or in the composer.
 */
export default function PreviewSheet({ visible, post, media, submitting, confirmLabel, onConfirm, onClose }: Props) {
  const { t } = useTranslation();
  // New picks while composing; the post's own media while editing (it can't change).
  const shown = media.length
    ? media.map((m) => ({ key: m.uri, uri: m.kind === 'image' ? m.uri : m.thumbnailUri ?? null, video: m.kind === 'video' }))
    : (post.media ?? []).map((m) => ({ key: m.id, uri: m.thumbnail_url ?? m.public_url ?? null, video: m.kind === 'video' }));
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <T step="headline" weight="bold" style={{ flex: 1 }}>
            {t('community.compose.previewTitle')}
          </T>
          <Touchable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('community.compose.keepEditing')}>
            <X size={22} color={Colors.text.tertiary} />
          </Touchable>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={{ backgroundColor: Colors.background.card, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border.default }}>
            <PostHeader post={post} />
            <PostBody post={post} truncate={false} />
            {post.poll ? (
              // The options as they will read; votes start once it is posted.
              <View style={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 }}>
                {[...post.poll.options].sort((a, b) => a.position - b.position).map((o) => (
                  <View
                    key={o.id}
                    style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border.default, backgroundColor: Colors.background.medium }}
                  >
                    <Text style={{ color: Colors.text.primary, fontSize: 14, fontWeight: '600' }} numberOfLines={2}>
                      {o.label}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
            {shown.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, padding: 12 }}>
                {shown.map((m) => (
                  <View key={m.key} style={{ width: 240, height: 240, borderRadius: 8, overflow: 'hidden', backgroundColor: Colors.background.medium, alignItems: 'center', justifyContent: 'center' }}>
                    {m.uri ? (
                      <Image source={{ uri: m.uri }} style={{ position: 'absolute', width: '100%', height: '100%' }} contentFit="cover" />
                    ) : null}
                    {m.video ? <Play size={40} color={Colors.textWhite} fill={Colors.textWhite} /> : null}
                  </View>
                ))}
              </ScrollView>
            ) : null}
          </View>
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderColor: Colors.border.default }}>
          <TouchableOpacity
            onPress={onClose}
            disabled={submitting}
            activeOpacity={0.8}
            style={{ flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.border.light }}
          >
            <Text style={{ color: Colors.text.primary, fontWeight: '700', fontSize: 15 }}>{t('community.compose.keepEditing')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            disabled={submitting}
            activeOpacity={0.8}
            style={{ flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.darkGold }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={Colors.textWhite} />
            ) : (
              <Text style={{ color: Colors.textWhite, fontWeight: '700', fontSize: 15 }}>{confirmLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
