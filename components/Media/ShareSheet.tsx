import * as Clipboard from 'expo-clipboard';
import { Check, Link2, MessageCircle, Share2, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Modal, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
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
 * server owns the canonical link and the share counter, and it is what creates
 * the community teaser post.
 */
export default function ShareSheet({ visible, item, onClose }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const requireAuth = useRequireAuth();
  const [busy, setBusy] = useState<MediaShareChannel | null>(null);
  const [copied, setCopied] = useState(false);

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
      await CasaMediaService.share(item.id, 'community');
      track('community');
      Alert.alert(t('casaMedia.sharedToCommunityTitle'), t('casaMedia.sharedToCommunityBody'));
      onClose();
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message ?? t('casaMedia.shareFailed'));
    } finally {
      setBusy(null);
    }
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
