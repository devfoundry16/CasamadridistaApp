import * as Clipboard from 'expo-clipboard';
import { Check, Download, Link2, MoreHorizontal, QrCode, Send, Share2, Trash2, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, ActivityIndicator, Alert, Modal, Platform, ScrollView, Share, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { postWebUrl } from '@/constants/media';
import { useFriends } from '@/hooks/social/useFriends';
import { useDeletePost } from '@/hooks/useDeletePost';
import { useDownloadMedia } from '@/hooks/useDownloadMedia';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useUser } from '@/hooks/useUser';
import type { Post } from '@/services/FeedService';
import PostService from '@/services/PostService';
import { isOwnPost } from '@/utils/post.core';
import { saveableFiles, shareSheetRows } from '@/utils/shareSheet.core';
import Avatar from './Avatar';
import FriendPicker from './FriendPicker';
import T from './T';

interface Props {
  visible: boolean;
  post: Post;
  onClose: () => void;
  /** After the author deleted the post from here (the post screen goes back). */
  onDeleted?: () => void;
}

/** How many friends the "Send to" row shows before "More". */
const SUGGESTED = 8;
/** iOS drops a second Modal presented while the first is still closing. */
const HANDOFF_MS = 320;

/**
 * The post share sheet (spec 2.1.0 §04).
 *
 * Send to friends inside the app; out of it through the https link (copied,
 * the phone's own share sheet, a QR code), which opens the app or the web page
 * at /p/<id>. The author also gets Save to Photos and Delete; nobody else ever
 * sees them. Nothing here posts straight into another app: WhatsApp, Telegram
 * and the rest come through the phone's share sheet.
 */
export default function PostShareSheet({ visible, post, onClose, onDeleted }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const requireAuth = useRequireAuth();
  const { user } = useUser();
  const { data: friends = [] } = useFriends({ enabled: visible });
  const { save, isSaving } = useDownloadMedia();
  const { confirmAndDelete } = useDeletePost();
  const [picker, setPicker] = useState<{ open: boolean; preselect?: string[] }>({ open: false });
  const [qr, setQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

  const url = postWebUrl(post.id);
  const isOwn = isOwnPost(post, user?.id);
  const files = saveableFiles(post.media);
  const rows = shareSheetRows({ isOwn, saveable: files.length > 0 });

  /** Close this sheet, then open something else once it has gone (iOS). */
  const thenOpen = (open: () => void) => {
    onClose();
    setTimeout(open, HANDOFF_MS);
  };

  const toFriends = (preselect?: string[]) => {
    if (!requireAuth({ href: `/community/post/${post.id}` })) {
      onClose();
      return;
    }
    thenOpen(() => setPicker({ open: true, preselect }));
  };

  const copyLink = async () => {
    await Clipboard.setStringAsync(url);
    setCopied(true);
    AccessibilityInfo.announceForAccessibility(t('postShare.linkCopied'));
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    void PostService.sharePost(post.id, 'copy_link');
  };

  const shareVia = () =>
    thenOpen(async () => {
      try {
        const title = (post.title || post.body || t('social.share.postFallback')).slice(0, 120);
        // iOS shares `message` and `url` side by side; Android ignores `url`,
        // so there the link goes in the message. Never both, or it shows twice.
        const content = Platform.OS === 'ios' ? { message: title, url } : { message: `${title}\n${url}` };
        const result = await Share.share(content);
        if (result.action === Share.sharedAction) void PostService.sharePost(post.id, 'native_share');
      } catch {
        // dismissed
      }
    });

  const showQr = () =>
    thenOpen(() => {
      setQr(true);
      void PostService.sharePost(post.id, 'qr');
    });

  // Stops at the first photo that could not be saved (its own alert says
  // why), and counts a save only when every one is in the library.
  const saveToPhotos = async () => {
    for (const file of files) {
      if (!(await save(file.url, { id: file.id }))) return;
    }
    void PostService.sharePost(post.id, 'save');
    Alert.alert(t('postShare.saved'));
  };

  // The confirm is an Alert: shown only once this sheet has closed (iOS).
  const remove = () => thenOpen(() => confirmAndDelete(post.id, onDeleted));

  const shown = friends.slice(0, SUGGESTED);

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
            <Touchable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('common.close')}>
              <X size={20} color={Colors.text.tertiary} />
            </Touchable>
          </View>

          {/* Send to: your friends as avatars when there are some, else one row. */}
          {user?.id && shown.length ? (
            <View style={{ borderBottomWidth: 1, borderBottomColor: Colors.border.default, paddingBottom: 12 }}>
              <T step="caption" color={Colors.text.tertiary} style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                {t('postShare.sendTo')}
              </T>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 84 }} contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}>
                {shown.map((f) => (
                  <Touchable
                    key={f.id}
                    onPress={() => toFriends([f.id])}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('postShare.sendTo')} ${f.name}`}
                    style={({ pressed }) => ({ width: 68, alignItems: 'center', opacity: pressed ? 0.6 : 1 })}
                  >
                    <Avatar uri={f.avatar_url} name={f.name} size={52} />
                    <T step="caption" numberOfLines={1} style={{ marginTop: 4, maxWidth: 64 }}>
                      {f.name}
                    </T>
                  </Touchable>
                ))}
                <Touchable
                  onPress={() => toFriends()}
                  accessibilityRole="button"
                  accessibilityLabel={t('postShare.more')}
                  style={({ pressed }) => ({ width: 68, alignItems: 'center', opacity: pressed ? 0.6 : 1 })}
                >
                  <View style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background.card, borderWidth: 1, borderColor: Colors.border.default }}>
                    <MoreHorizontal size={22} color={Colors.text.secondary} />
                  </View>
                  <T step="caption" style={{ marginTop: 4 }}>
                    {t('postShare.more')}
                  </T>
                </Touchable>
              </ScrollView>
            </View>
          ) : (
            <Row icon={<Send size={20} color={Colors.darkGold} />} label={t('social.share.toFriend')} caption={t('social.share.toFriendCaption')} onPress={() => toFriends()} />
          )}

          {rows.includes('copy_link') ? (
            <Row
              icon={copied ? <Check size={20} color={Colors.status.success} /> : <Link2 size={20} color={Colors.darkGold} />}
              label={copied ? t('postShare.linkCopied') : t('postShare.copyLink')}
              onPress={copyLink}
            />
          ) : null}
          {rows.includes('share') ? <Row icon={<Share2 size={20} color={Colors.darkGold} />} label={t('postShare.shareVia')} onPress={shareVia} /> : null}
          {rows.includes('qr') ? <Row icon={<QrCode size={20} color={Colors.darkGold} />} label={t('postShare.qrCode')} onPress={showQr} last={!isOwn} /> : null}
          {rows.includes('save') ? (
            <Row
              icon={isSaving ? <ActivityIndicator color={Colors.darkGold} /> : <Download size={20} color={Colors.darkGold} />}
              label={t('postShare.saveToPhotos')}
              onPress={() => {
                if (!isSaving) void saveToPhotos();
              }}
            />
          ) : null}
          {rows.includes('delete') ? (
            <Row icon={<Trash2 size={20} color={Colors.status.error} />} label={t('postShare.deletePost')} onPress={remove} destructive last />
          ) : null}
        </View>
      </Modal>

      <QrSheet visible={qr} url={url} onClose={() => setQr(false)} />

      <FriendPicker
        visible={picker.open}
        initialSelected={picker.preselect}
        onClose={() => setPicker({ open: false })}
        onSent={() => void PostService.sharePost(post.id, 'dm')}
        kind="post"
        id={post.id}
        subject={post.title ?? post.body}
      />
    </>
  );
}

/** The post's link as a QR code, for someone standing next to you. */
function QrSheet({ visible, url, onClose }: { visible: boolean; url: string; onClose: () => void }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Touchable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)' }} />
      <View
        accessibilityViewIsModal
        style={{ position: 'absolute', start: 24, end: 24, top: insets.top + 80, alignItems: 'center', padding: 20, borderRadius: 16, backgroundColor: Colors.background.deepDark, borderWidth: 1, borderColor: Colors.border.default }}
      >
        <T step="headline" weight="bold" style={{ textAlign: 'center' }}>
          {t('postShare.qrTitle')}
        </T>
        {/* Black on white, whatever the theme: scanners need the contrast. */}
        <View style={{ marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: '#ffffff' }}>
          <QRCode value={url} size={220} color="#000000" backgroundColor="#ffffff" />
        </View>
        <T step="caption" color={Colors.text.tertiary} selectable style={{ marginTop: 12, textAlign: 'center' }}>
          {url}
        </T>
        <T step="caption" color={Colors.text.tertiary} style={{ marginTop: 6, textAlign: 'center' }}>
          {t('postShare.qrHint')}
        </T>
        <Touchable
          onPress={onClose}
          accessibilityRole="button"
          style={({ pressed }) => ({ marginTop: 16, minHeight: 44, paddingHorizontal: 24, borderRadius: 12, justifyContent: 'center', backgroundColor: Colors.darkGold, opacity: pressed ? 0.7 : 1 })}
        >
          <T step="body" weight="semibold" color={Colors.text.dark}>
            {t('common.close')}
          </T>
        </Touchable>
      </View>
    </Modal>
  );
}

/** The `Row` recipe from `components/Media/ShareSheet.tsx`. */
export function Row({
  icon,
  label,
  caption,
  onPress,
  last = false,
  destructive = false,
}: {
  icon: React.ReactNode;
  label: string;
  caption?: string;
  onPress: () => void;
  last?: boolean;
  destructive?: boolean;
}) {
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
        <T step="body" weight="semibold" color={destructive ? Colors.status.error : undefined}>
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
