import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Eye, MoreHorizontal, Send, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Avatar from '@/components/Social/Avatar';
import RichText from '@/components/Social/RichText';
import SocialReportSheet from '@/components/Social/SocialReportSheet';
import T from '@/components/Social/T';
import Colors from '@/constants/colors';
import { useStoryActions } from '@/hooks/social/useStories';
import SocialService from '@/services/SocialService';
import type { StoryViewer, UserStory, UserStoryGroup } from '@/types/social';
import { QUICK_REACTIONS, msUntilExpiry, nextAuthor, showForMs, step, videoProgress, type Position } from '@/utils/stories.core';
import { relativeTime } from '@/components/Media/time';

interface Props {
  groups: UserStoryGroup[];
  viewerId: string | null;
  initialGroup?: number;
  /** The story to start at within the first person's stories (a profile's strip). */
  initialStory?: number;
  onClose: () => void;
}

/**
 * A person's stories, full screen (Social, C1). Tap the right of the screen
 * for the next story, the left for the previous; hold to pause. The author
 * sees who viewed it and can delete it; anyone else can reply or react (both
 * arrive as a DM), mute the author or report the story.
 *
 * The groups are a snapshot taken on open: the feed refetches underneath
 * (a view, a mute), and walking live query data by index would jump to
 * someone else mid-story.
 */
export default function UserStoryViewer({ groups: initialGroups, viewerId, initialGroup = 0, initialStory = 0, onClose }: Props) {
  const [groups] = useState(initialGroups);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const actions = useStoryActions();
  const [at, setAt] = useState<Position>(() => {
    const group = Math.min(initialGroup, Math.max(0, groups.length - 1));
    const count = groups[group]?.stories.length ?? 0;
    return { group, story: Math.min(Math.max(0, initialStory), Math.max(0, count - 1)) };
  });
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reply, setReply] = useState('');
  const [menu, setMenu] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [viewers, setViewers] = useState<{ count: number; viewers: StoryViewer[] } | null>(null);
  const started = useRef(Date.now());
  const elapsedBeforePause = useRef(0);

  const group = groups[at.group];
  const story: UserStory | undefined = group?.stories[at.story];
  const mine = !!story && story.author_id === viewerId;
  const duration = story ? showForMs(story) : 5000;

  const player = useVideoPlayer(story?.kind === 'video' && story.hls_url ? story.hls_url : null, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.05;
  });
  const isVideo = story?.kind === 'video' && !!story.hls_url;

  const go = useCallback((dir: 1 | -1) => {
    const next = step(groups, at, dir);
    if (next === 'close') return onClose();
    setAt(next);
  }, [groups, at, onClose]);

  // Nothing to show (an empty snapshot): close rather than leave a black
  // screen with no way out.
  useEffect(() => {
    if (!story) onClose();
  }, [story, onClose]);

  // The groups are a snapshot, so the viewer keeps time itself: a story whose
  // 24 hours run out is left at once, including while paused or in a menu.
  useEffect(() => {
    if (!story) return;
    const left = msUntilExpiry(story, Date.now());
    if (left === 0) return go(1);
    // setTimeout cannot hold more than about 24.8 days; a story has 24 hours.
    const id = setTimeout(() => go(1), left);
    return () => clearTimeout(id);
  }, [story, go]);

  // A video drives its own bar from the player's clock and moves on when it
  // ends, so buffering never cuts the end off.
  useEffect(() => {
    if (!isVideo) return;
    const time = player.addListener('timeUpdate', ({ currentTime }) => setProgress(videoProgress(currentTime, player.duration)));
    const end = player.addListener('playToEnd', () => go(1));
    return () => {
      time.remove();
      end.remove();
    };
  }, [isVideo, player, go]);

  // A new story: reset the clock, count the view, start a video.
  useEffect(() => {
    if (!story) return;
    started.current = Date.now();
    elapsedBeforePause.current = 0;
    setProgress(0);
    if (!mine) void actions.view(story.id);
    if (isVideo) player.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  // The progress bar, and moving on when the time is up.
  const busy = paused || menu || reportOpen || !!viewers || reply.length > 0;
  useEffect(() => {
    if (!story) return;
    if (isVideo) {
      if (busy) player.pause();
      else player.play();
      return;
    }
    if (busy) {
      elapsedBeforePause.current += Date.now() - started.current;
      return;
    }
    started.current = Date.now();
    const timer = setInterval(() => {
      const elapsed = elapsedBeforePause.current + Date.now() - started.current;
      const p = Math.min(1, elapsed / duration);
      setProgress(p);
      if (p >= 1) {
        clearInterval(timer);
        go(1);
      }
    }, 50);
    return () => clearInterval(timer);
  }, [busy, story, isVideo, duration, go, player]);

  const author = group?.author ?? null;
  const send = async (input: { body?: string; reaction?: string }) => {
    if (!story) return;
    try {
      await actions.reply(story.id, input);
      setReply('');
      Alert.alert(t('stories.replySent'));
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.code === 'request_limit' ? t('stories.requestLimit') : t('stories.replyFailed'));
    }
  };

  const openViewers = async () => {
    if (!story) return;
    try {
      setViewers(await SocialService.storyViewers(story.id));
    } catch {
      setViewers({ count: 0, viewers: [] });
    }
  };

  const remove = () => {
    if (!story) return;
    Alert.alert(t('stories.deleteTitle'), t('stories.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('stories.delete'),
        style: 'destructive',
        onPress: async () => {
          setMenu(false);
          await actions.remove(story.id).catch(() => Alert.alert(t('common.error'), t('stories.deleteFailed')));
          onClose();
        },
      },
    ]);
  };

  const mute = async () => {
    if (!story) return;
    setMenu(false);
    // Never claim it worked when it did not: the person would go on seeing
    // stories they believe they muted.
    try {
      await actions.mute(story.author_id);
    } catch {
      Alert.alert(t('common.error'), t('stories.muteFailed'));
      return;
    }
    Alert.alert(t('stories.muted', { name: author?.name ?? '' }));
    const next = nextAuthor(groups, at);
    if (next === 'close') onClose();
    else setAt(next);
  };

  const bars = useMemo(() => group?.stories ?? [], [group]);
  if (!story || !group) return null;

  return (
    <View style={styles.root}>
      {/* Media */}
      {story.kind === 'photo' && story.url ? (
        <Image source={{ uri: story.url }} style={StyleSheet.absoluteFill} contentFit="contain" />
      ) : story.kind === 'video' && story.hls_url ? (
        <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <T color={Colors.text.secondary}>{t('stories.unavailable')}</T>
        </View>
      )}

      {/* Tap zones: back on the left third, forward elsewhere; hold to pause. */}
      <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
        <Pressable style={{ flex: 1 }} onPress={() => go(-1)} onLongPress={() => setPaused(true)} onPressOut={() => setPaused(false)}
          accessibilityRole="button" accessibilityLabel={t('stories.previous')} />
        <Pressable style={{ flex: 2 }} onPress={() => go(1)} onLongPress={() => setPaused(true)} onPressOut={() => setPaused(false)}
          accessibilityRole="button" accessibilityLabel={t('stories.next')} />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.bars}>
          {bars.map((s, i) => (
            <View key={s.id} style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${i < at.story ? 100 : i === at.story ? progress * 100 : 0}%` }]} />
            </View>
          ))}
        </View>
        <View style={styles.headerRow}>
          <Pressable style={styles.person} onPress={() => { onClose(); router.push(`/user/${story.author_id}` as any); }}>
            <Avatar uri={author?.avatar_url} name={author?.name} size={32} />
            <T weight="semibold">{mine ? t('stories.you') : author?.name ?? ''}</T>
            <T color={Colors.text.secondary} style={{ fontSize: 12 }}>{relativeTime(story.published_at) ?? ''}</T>
          </Pressable>
          <Pressable onPress={() => setMenu(true)} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('stories.more')}>
            <MoreHorizontal size={22} color="#fff" />
          </Pressable>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('common.close')}>
            <X size={24} color="#fff" />
          </Pressable>
        </View>
      </View>

      {story.caption ? (
        <View style={[styles.caption, { bottom: insets.bottom + (mine ? 64 : 120) }]}>
          {/* @mentions and #tags open their screen, closing the viewer first as the author's name does. */}
          <RichText text={story.caption} style={{ textAlign: 'center' }} onNavigate={onClose} />
        </View>
      ) : null}

      {/* Footer */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
        {mine ? (
          <Pressable style={styles.seenBy} onPress={openViewers} accessibilityRole="button">
            <Eye size={18} color="#fff" />
            <T>{t('stories.seenBy')}</T>
          </Pressable>
        ) : (
          <>
            <View style={styles.reactions}>
              {QUICK_REACTIONS.map((r) => (
                <Pressable key={r} onPress={() => send({ reaction: r })} hitSlop={6} accessibilityRole="button" accessibilityLabel={t('stories.react', { reaction: r })}>
                  <T style={{ fontSize: 26 }}>{r}</T>
                </Pressable>
              ))}
            </View>
            <View style={styles.replyRow}>
              <TextInput
                value={reply}
                onChangeText={setReply}
                placeholder={t('stories.replyPlaceholder', { name: author?.name ?? '' })}
                placeholderTextColor={Colors.text.secondary}
                style={styles.input}
                maxLength={1000}
              />
              <Pressable disabled={!reply.trim()} onPress={() => send({ body: reply })} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('stories.send')}>
                <Send size={22} color={reply.trim() ? Colors.darkGold : Colors.text.secondary} />
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>

      {/* Menu */}
      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setMenu(false)}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
            {mine ? (
              <Pressable style={styles.sheetRow} onPress={remove}><T color={Colors.status.error}>{t('stories.delete')}</T></Pressable>
            ) : (
              <>
                <Pressable style={styles.sheetRow} onPress={mute}><T>{t('stories.mute', { name: author?.name ?? '' })}</T></Pressable>
                <Pressable style={styles.sheetRow} onPress={() => { setMenu(false); setReportOpen(true); }}><T color={Colors.status.error}>{t('stories.report')}</T></Pressable>
              </>
            )}
            <Pressable style={styles.sheetRow} onPress={() => setMenu(false)}><T color={Colors.text.secondary}>{t('common.cancel')}</T></Pressable>
          </View>
        </Pressable>
      </Modal>

      <SocialReportSheet visible={reportOpen} target={reportOpen ? { kind: 'story', id: story.id } : null} onClose={() => setReportOpen(false)} />

      {/* Who saw it (the author only) */}
      <Modal visible={!!viewers} transparent animationType="slide" onRequestClose={() => setViewers(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setViewers(null)}>
          <View style={[styles.sheet, { maxHeight: '60%', paddingBottom: insets.bottom + 12 }]}>
            <T weight="semibold" style={{ padding: 16 }}>{t('stories.viewers', { count: viewers?.count ?? 0 })}</T>
            <FlatList
              data={viewers?.viewers ?? []}
              keyExtractor={(v) => v.id}
              ListEmptyComponent={<T color={Colors.text.secondary} style={{ paddingHorizontal: 16 }}>{t('stories.noViewers')}</T>}
              renderItem={({ item }) => {
                const name = [item.first_name, item.last_name].filter(Boolean).join(' ') || (item.username ? `@${item.username}` : '');
                return (
                  <View style={styles.viewerRow}>
                    <Avatar uri={item.avatar_url} name={name} size={36} />
                    <T style={{ flex: 1 }}>{name}</T>
                    <T color={Colors.text.secondary} style={{ fontSize: 12 }}>{relativeTime(item.viewed_at) ?? ''}</T>
                  </View>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 12, gap: 10 },
  bars: { flexDirection: 'row', gap: 4 },
  barTrack: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  barFill: { height: 3, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  person: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  caption: { position: 'absolute', left: 16, right: 16, padding: 10, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.45)' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 12, gap: 10 },
  reactions: { flexDirection: 'row', justifyContent: 'space-around' },
  replyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', borderRadius: 24, paddingHorizontal: 14, paddingVertical: 6 },
  input: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 6, textAlign: 'auto' },
  seenBy: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', padding: 8 },
  sheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: Colors.background.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 8 },
  sheetRow: { paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: Colors.border.default },
  viewerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
});
