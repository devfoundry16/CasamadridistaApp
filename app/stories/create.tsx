import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Camera, ImagePlus } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';

import T from '@/components/Social/T';
import Colors from '@/constants/colors';
import { usePostStory, type PickedMedia } from '@/hooks/social/useStories';
import { MAX_VIDEO_MS, pickProblem } from '@/utils/stories.core';
import MentionSuggestions from '@/components/Community/Composer/MentionSuggestions';
import type { PersonCard } from '@/types/social';
import { activeMention, insertMention, type Caret } from '@/utils/mentions.core';

const CAPTION_MAX = 200;

/**
 * Post a story (C1): one photo or a video of up to 15 seconds, from the
 * camera or the library, with an optional caption (@mentions notify). Live
 * for 24 hours; a video goes live once it has been processed.
 */
export default function CreateStoryScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const post = usePostStory();
  const [media, setMedia] = useState<PickedMedia | null>(null);
  const [caption, setCaption] = useState('');
  // @-autocomplete, as in the post composer: the caret, and one to impose once
  // after a mention is inserted (then released, so selection stays native).
  const [focused, setFocused] = useState(false);
  const [caret, setCaret] = useState<Caret>({ start: 0, end: 0 });
  const [forcedCaret, setForcedCaret] = useState<Caret | null>(null);
  const mention = useMemo(() => (focused ? activeMention(caption, caret) : null), [focused, caption, caret]);
  const pickMention = useCallback(
    (person: PersonCard & { username: string }) => {
      if (!mention) return;
      const next = insertMention(caption, mention, person.username);
      // Past the caption's limit the mention would be cut; leave the text alone.
      if (next.text.length > CAPTION_MAX) return;
      setCaption(next.text);
      const at = { start: next.caret, end: next.caret };
      setCaret(at);
      setForcedCaret(at);
    },
    [mention, caption],
  );
  const player = useVideoPlayer(media?.type === 'video' ? media.uri : null, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  const take = async (source: 'camera' | 'library') => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('account.permissionDenied'), t('account.grantAccess'));
      return;
    }
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images', 'videos'],
      videoMaxDuration: MAX_VIDEO_MS / 1000,
      quality: 1,
    };
    const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;
    const a = result.assets[0];
    const picked: PickedMedia = {
      uri: a.uri,
      type: a.type === 'video' ? 'video' : 'image',
      mimeType: a.mimeType ?? null,
      width: a.width,
      height: a.height,
      durationMs: a.duration ?? null,
    };
    const problem = pickProblem({ type: picked.type, durationMs: picked.durationMs, fileSize: a.fileSize ?? null });
    if (problem) {
      Alert.alert(t('stories.title'), t(`stories.${problem}`));
      return;
    }
    setMedia(picked);
  };

  const share = () => {
    if (!media) return;
    post.mutate(
      { media, caption },
      {
        onSuccess: (story) => {
          Alert.alert(t('stories.title'), story?.status === 'processing' ? t('stories.processing') : t('stories.posted'));
          router.back();
        },
        onError: (e: any) => {
          const code = e?.code;
          Alert.alert(
            t('common.error'),
            code === 'story_blocked' || code === 'caption_blocked'
              ? t('stories.blocked')
              : code === 'video_unavailable'
                ? t('stories.videoUnavailable')
                : code === 'account_restricted'
                  ? t('community.accountRestricted')
                  : t('stories.failed')
          );
        },
      }
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: Colors.background.dark }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {media ? (
          <View style={{ aspectRatio: 9 / 16, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' }}>
            {media.type === 'image' ? (
              <Image source={{ uri: media.uri }} style={{ flex: 1 }} contentFit="cover" />
            ) : (
              <VideoView player={player} style={{ flex: 1 }} contentFit="cover" nativeControls={false} />
            )}
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable onPress={() => take('camera')} style={tile} accessibilityRole="button">
              <Camera size={28} color={Colors.darkGold} />
              <T>{t('stories.camera')}</T>
            </Pressable>
            <Pressable onPress={() => take('library')} style={tile} accessibilityRole="button">
              <ImagePlus size={28} color={Colors.darkGold} />
              <T>{t('stories.library')}</T>
            </Pressable>
          </View>
        )}
        <T color={Colors.text.secondary} style={{ fontSize: 12 }}>{t('stories.hint')}</T>
        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder={t('stories.captionPlaceholder')}
          placeholderTextColor={Colors.text.secondary}
          maxLength={CAPTION_MAX}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSelectionChange={(event) => {
            setCaret(event.nativeEvent.selection);
            setForcedCaret(null);
          }}
          selection={forcedCaret ?? undefined}
          multiline
          style={{ color: Colors.text.primary, borderWidth: 1, borderColor: Colors.border.default, borderRadius: 12, padding: 12, minHeight: 64, textAlign: 'auto' }}
        />
        {mention ? <MentionSuggestions query={mention.query} onPick={pickMention} /> : null}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {media ? (
            <Pressable onPress={() => setMedia(null)} style={[button, { backgroundColor: Colors.background.light }]} accessibilityRole="button">
              <T>{t('stories.change')}</T>
            </Pressable>
          ) : null}
          <Pressable disabled={!media || post.isPending} onPress={share} style={[button, { flex: 1, backgroundColor: media ? Colors.darkGold : Colors.background.light }]} accessibilityRole="button">
            {post.isPending ? <ActivityIndicator color="#1A1A1A" /> : <T weight="semibold" color={media ? '#1A1A1A' : Colors.text.secondary}>{t('stories.share')}</T>}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const tile = { flex: 1, aspectRatio: 1, borderRadius: 16, borderWidth: 1, borderColor: Colors.border.default, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 8, backgroundColor: Colors.background.card };
const button = { paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center' as const };
