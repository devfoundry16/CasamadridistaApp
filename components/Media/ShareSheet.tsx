import * as Clipboard from 'expo-clipboard';
import { Check, Link2, MessageCircle, Send, Share2, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Modal, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import FriendPicker from '@/components/Social/FriendPicker';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { mediaWebUrl } from '@/constants/media';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import AnalyticsService from '@/services/AnalyticsService';
import CasaMediaService from '@/services/CasaMediaService';
import type { MediaItem, MediaShareChannel } from '@/types/media/casaMedia';

interface Props {
  visible: boolean;
  item: MediaItem;
  onClose: () => void;
}

/**
 * Share destinations for one media item.
 *
 * Presented in an RN `Modal` (same pattern as `Community/Moderation/ReportSheet`)
 * rather than an in-scene overlay, so it is never clipped by a pager or a tab
 * bar. Every channel round-trips through `POST /items/:id/share` first: the
 * server owns the canonical link and the share counter. For `community` it also
 * creates the teaser post — one per user per item, so sharing again returns the
 * same post — and moderates it; `post_status` says whether it is in the feed
 * yet or waiting for review.
 */
export default function ShareSheet({ visible, item, onClose }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const requireAuth = useRequireAuth();
  const [busy, setBusy] = useState<MediaShareChannel | null>(null);
  const [copied, setCopied] = useState(false);
  const [picker, setPicker] = useState(false);

  const resolveUrl = useCallback(
    async (channel: MediaShareChannel): Promise<string> => {
      try {
        const { share_url } = await CasaMediaService.share(item.id, channel);
        return share_url || mediaWebUrl(item.id);
      } catch {
        // A failed counter must not cost the user their share.
        return item.web_url ?? mediaWebUrl(item.id);
      }
    },
    [item.id, item.web_url],
  );

  const track = (channel: MediaShareChannel) =>
    AnalyticsService.track('share_click', { item_id: item.id, props: { channel } });

  const handleCommunity = async () => {
    if (!requireAuth({ href: `/media/item/${item.id}`, mediaId: item.id })) {
      onClose();
      return;
    }
    setBusy('community');
    try {
      const { post_status } = await CasaMediaService.share(item.id, 'community');
      track('community');
      // Only an approved post is in the feed. A non-subscriber's post can be
      // held for review, and "now in the feed" would send them looking for it.
      if (post_status === 'approved') {
        Alert.alert(t('casaMedia.sharedToCommunityTitle'), t('casaMedia.sharedToCommunityBody'));
      } else {
        Alert.alert(
          t('casaMedia.sharedToCommunityPendingTitle'),
          t('casaMedia.sharedToCommunityPendingBody'),
        );
      }
      onClose();
    } catch (error: any) {
      // `not_published`: a staff preview of an unpublished item can be opened,
      // but not posted to the feed. `not_shareable`: the item exists and is
      // live, but the backend will not make a community post of it.
      const message =
        error?.message === 'not_published'
          ? t('casaMedia.shareNotPublished')
          : error?.message === 'not_shareable'
            ? t('casaMedia.shareNotShareable')
            : (error?.message ?? t('casaMedia.shareFailed'));
      Alert.alert(t('common.error'), message);
    } finally {
      setBusy(null);
    }
  };

  /**
   * §37 / §38: send the item to one or more friends inside the app. The share is
   * counted like every other channel (`dm` is already in the backend's share
   * vocabulary), and the friend receives the item as its access-checked teaser.
   */
  const handleFriend = () => {
    if (!requireAuth({ href: `/media/item/${item.id}`, mediaId: item.id })) {
      onClose();
      return;
    }
    track('dm');
    void CasaMediaService.share(item.id, 'dm').catch(() => {});
    onClose();
    // After the sheet has left: a second Modal presented while this one is
    // still dismissing is dropped on iOS.
    setTimeout(() => setPicker(true), 320);
  };

  const handleCopy = async () => {
    setBusy('copy_link');
    try {
      const url = await resolveUrl('copy_link');
      await Clipboard.setStringAsync(url);
      track('copy_link');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert(t('common.error'), t('casaMedia.shareFailed'));
    } finally {
      setBusy(null);
    }
  };

  const handleExternal = async () => {
    setBusy('external');
    try {
      const url = await resolveUrl('external');
      track('external');
      await Share.share({ message: item.title ? `${item.title}\n${url}` : url, url });
      onClose();
    } catch {
      // The user dismissed the system sheet.
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Touchable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t('common.cancel')}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }}
      />

      <View
        accessibilityViewIsModal
        style={{
          position: 'absolute',
          start: 0,
          end: 0,
          bottom: 0,
          backgroundColor: Colors.background.deepDark,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderTopWidth: 1,
          borderColor: Colors.border.default,
          paddingBottom: insets.bottom + 12,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <Text className="text-[17px] font-bold" style={{ flex: 1, color: Colors.text.primary }}>
            {t('casaMedia.share')}
          </Text>
          <Touchable onPress={onClose} hitSlop={10} accessibilityRole="button">
            <X size={20} color={Colors.text.tertiary} />
          </Touchable>
        </View>

        <Row
          icon={<Send size={20} color={Colors.darkGold} />}
          label={t('social.share.toFriend')}
          caption={t('social.share.toFriendCaption')}
          busy={false}
          onPress={handleFriend}
        />
        <Row
          icon={<MessageCircle size={20} color={Colors.darkGold} />}
          label={t('casaMedia.shareToCommunity')}
          caption={t('casaMedia.shareToCommunityCaption')}
          busy={busy === 'community'}
          onPress={handleCommunity}
        />
        <Row
          icon={
            copied ? (
              <Check size={20} color={Colors.status.success} />
            ) : (
              <Link2 size={20} color={Colors.darkGold} />
            )
          }
          label={copied ? t('casaMedia.linkCopied') : t('casaMedia.copyLink')}
          busy={busy === 'copy_link'}
          onPress={handleCopy}
        />
        <Row
          icon={<Share2 size={20} color={Colors.darkGold} />}
          label={t('casaMedia.shareExternal')}
          busy={busy === 'external'}
          onPress={handleExternal}
          last
        />
      </View>
    </Modal>
    <FriendPicker visible={picker} onClose={() => setPicker(false)} kind="media_item" id={item.id} subject={item.title} />
    </>
  );
}

function Row({
  icon,
  label,
  caption,
  busy,
  onPress,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  caption?: string;
  busy: boolean;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Touchable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 56,
          paddingHorizontal: 16,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: Colors.border.default,
        },
        pressed && { backgroundColor: Colors.background.card },
      ]}
    >
      <View style={{ width: 28, alignItems: 'center' }}>{icon}</View>
      <View style={{ flex: 1, marginStart: 12 }}>
        <Text className="text-[15px] font-semibold" style={{ color: Colors.text.primary }}>
          {label}
        </Text>
        {caption ? (
          <Text className="text-[11px]" style={{ color: Colors.text.tertiary, marginTop: 2 }}>
            {caption}
          </Text>
        ) : null}
      </View>
      {busy ? <ActivityIndicator size="small" color={Colors.darkGold} /> : null}
    </Touchable>
  );
}
