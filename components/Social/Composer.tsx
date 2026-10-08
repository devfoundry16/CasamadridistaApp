import {
  getRecordingPermissionsAsync,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { ArrowUp, Camera, Film, ImagePlus, Mic, Reply, Trash2, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, I18nManager, Linking, PanResponder, ScrollView, TextInput, View } from 'react-native';

import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { typeStyle } from '@/constants/type';
import { useFont } from '@/contexts/FontContext';
import type { OutgoingInput, PhotoInput, VideoInput, VoiceInput } from '@/hooks/social/useThread';
import type { ChatMessage } from '@/types/social';
import { canAddPhotos, formatDuration, isCancelGesture, recordingOutcome, RECORD_MAX_MS, videoPickProblem } from '@/utils/chat.core';
import T from './T';
import VoiceBubble from './VoiceBubble';

const MAX_PHOTOS = 4;
const BODY_MAX = 2000;

interface Props {
  onSend: (input: OutgoingInput) => void;
  onTyping: () => void;
  /** Static bottom padding from `useKeyboardOffsets` — never toggled on keyboard show. */
  bottomInset: number;
  /** When set, the composer is replaced by this explanation. */
  disabledReason?: string | null;
  /** The message being replied to, shown above the input. */
  replyingTo?: ChatMessage | null;
  /** Who wrote it, for the banner. */
  replyingToName?: string;
  onCancelReply?: () => void;
}

/**
 * The thread composer. A near-copy of `Community/Comments/CommentInput` in
 * structure, so the keyboard maths in `hooks/useKeyboardOffsets.ts` holds, with
 * a media tray and a gold send button carrying a dark glyph.
 *
 * With nothing typed, the send button is a microphone: hold to record a voice
 * note (up to two minutes), slide toward the start edge to cancel, let go to
 * preview it before sending.
 */
export default function Composer({ onSend, onTyping, bottomInset, disabledReason, replyingTo, replyingToName, onCancelReply }: Props) {
  const { t } = useTranslation();
  const { isArabic } = useFont();
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<PhotoInput[]>([]);
  const [video, setVideo] = useState<VideoInput | null>(null);
  const [voice, setVoice] = useState<VoiceInput | null>(null);
  const [recording, setRecording] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);
  const recordingRef = useRef(false);
  const cancellingRef = useRef(false);
  /** The finger is still on the mic: setup is async, and a release can land first. */
  const holdingRef = useRef(false);

  const startRecording = async () => {
    holdingRef.current = true;
    const current = await getRecordingPermissionsAsync();
    if (!current.granted) {
      // The system prompt takes over the screen; this press never records.
      // Once allowed, the next hold does.
      holdingRef.current = false;
      const asked = current.canAskAgain ? await requestRecordingPermissionsAsync() : current;
      if (!asked.granted) Alert.alert(t('account.permissionDenied'), t('social.voice.micDenied'));
      else setHint(t('social.voice.holdToRecord'));
      return;
    }
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      if (!holdingRef.current) {
        // Let go while it was getting ready: a tap, not a recording.
        await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
        setHint(t('social.voice.holdToRecord'));
        return;
      }
      recorder.record();
      recordingRef.current = true;
      cancellingRef.current = false;
      setCancelling(false);
      setRecording(true);
    } catch {
      setHint(t('social.voice.failed'));
    }
  };

  const stopRecording = async (cancelled: boolean) => {
    holdingRef.current = false;
    if (!recordingRef.current) return;
    recordingRef.current = false;
    setRecording(false);
    setCancelling(false);
    const durationMs = recorder.currentTime * 1000;
    try {
      await recorder.stop();
    } catch {
      /* already stopped */
    }
    await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    const outcome = recordingOutcome(durationMs, cancelled);
    if (outcome === 'too_short') setHint(t('social.voice.holdToRecord'));
    if (outcome === 'preview' && recorder.uri) setVoice({ uri: recorder.uri, durationMs: Math.min(durationMs, RECORD_MAX_MS) });
  };

  // Two minutes is the most a voice note can be.
  useEffect(() => {
    if (recording && recorderState.durationMillis >= RECORD_MAX_MS) void stopRecording(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording, recorderState.durationMillis]);

  // Leaving the thread mid-recording: stop, and give the audio session back
  // (left in record mode, iOS routes playback to the earpiece).
  useEffect(
    () => () => {
      if (recordingRef.current) void recorder.stop().catch(() => {});
      recordingRef.current = false;
      holdingRef.current = false;
      void setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    },
    [recorder],
  );

  useEffect(() => {
    if (!hint) return;
    const id = setTimeout(() => setHint(null), 2500);
    return () => clearTimeout(id);
  }, [hint]);

  const mic = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => void startRecording(),
      onPanResponderMove: (_, g) => {
        const next = isCancelGesture(g.dx, I18nManager.isRTL);
        if (next !== cancellingRef.current) {
          cancellingRef.current = next;
          setCancelling(next);
        }
      },
      onPanResponderRelease: () => void stopRecording(cancellingRef.current),
      onPanResponderTerminate: () => void stopRecording(true),
    }),
  ).current;

  if (disabledReason) {
    return (
      <View style={{ borderTopWidth: 1, borderColor: Colors.border.default, backgroundColor: Colors.background.dark, paddingBottom: bottomInset }}>
        <T step="footnote" color={Colors.text.tertiary} align="center" style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
          {disabledReason}
        </T>
      </View>
    );
  }

  // Gallery and camera photos join the tray the same way.
  const addPhotos = (assets: ImagePicker.ImagePickerAsset[]) =>
    setPhotos((current) =>
      [...current, ...assets.map((a) => ({ uri: a.uri, width: a.width || null, height: a.height || null }))].slice(0, MAX_PHOTOS),
    );

  const pick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('account.permissionDenied'), t('account.grantAccess'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: photos.length ? ['images'] : ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 1,
    });
    if (result.canceled) return;
    // A video travels on its own: the first one picked, without photos.
    const clip = result.assets.find((a) => a.type === 'video');
    if (clip) {
      const problem = videoPickProblem({ durationMs: clip.duration ?? null, fileSize: clip.fileSize ?? null });
      if (problem) {
        Alert.alert(t('social.composer.videoTitle'), t(`social.composer.${problem}`));
        return;
      }
      if (result.assets.length > 1) setHint(t('social.composer.videoAlone'));
      setPhotos([]);
      setVideo({ uri: clip.uri, durationMs: clip.duration ?? 0, width: clip.width || null, height: clip.height || null, mimeType: clip.mimeType ?? null });
      return;
    }
    addPhotos(result.assets);
  };

  // A photo from the camera joins the tray like one from the gallery.
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      // Once refused for good, only Settings can change it: say so, and go there.
      Alert.alert(
        t('account.permissionDenied'),
        t('social.composer.cameraDenied'),
        permission.canAskAgain
          ? undefined
          : [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('community.photoPermissionOpenSettings'), onPress: () => void Linking.openSettings() },
            ],
      );
      return;
    }
    // EXIF is not read: the upload re-encodes the photo and drops it anyway.
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1, exif: false });
    if (result.canceled) return;
    addPhotos(result.assets);
  };

  const canAdd = canAddPhotos({ photoCount: photos.length, hasVideo: !!video, max: MAX_PHOTOS });
  const canSend = text.trim().length > 0 || photos.length > 0 || !!video;
  const send = () => {
    if (voice) {
      onSend({ voice, replyTo: replyingTo });
      setVoice(null);
      return;
    }
    if (!canSend) return;
    onSend(video ? { body: text, video, replyTo: replyingTo } : { body: text, photos, replyTo: replyingTo });
    setText('');
    setPhotos([]);
    setVideo(null);
  };

  const showMic = !canSend && !voice;

  return (
    <View style={{ borderTopWidth: 1, borderColor: Colors.border.default, backgroundColor: Colors.background.dark, paddingBottom: bottomInset }}>
      {replyingTo ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 8 }}>
          <Reply size={16} color={Colors.darkGold} />
          <View style={{ flex: 1 }}>
            <T step="caption" weight="semibold" color={Colors.darkGold} numberOfLines={1}>
              {t('social.thread.replyingTo', { name: replyingToName ?? '' })}
            </T>
            <T step="footnote" color={Colors.text.secondary} numberOfLines={1}>
              {replyingTo.body ?? t(`social.preview.${replyingTo.kind === 'image' ? 'photo' : replyingTo.kind === 'voice' ? 'voice' : replyingTo.kind === 'video' ? 'video' : 'share'}`)}
            </T>
          </View>
          <Touchable onPress={onCancelReply} accessibilityRole="button" accessibilityLabel={t('social.thread.cancelReply')} hitSlop={8}>
            <X size={18} color={Colors.text.tertiary} />
          </Touchable>
        </View>
      ) : null}

      {photos.length || video ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 10, gap: 8 }}>
          {video ? (
            <View>
              <View style={{ width: 64, height: 64, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background.card }}>
                <Film size={22} color={Colors.darkGold} />
                <T step="caption" color={Colors.text.secondary} ltr>
                  {formatDuration(video.durationMs)}
                </T>
              </View>
              <RemoveChip label={t('social.composer.removeVideo')} onPress={() => setVideo(null)} />
            </View>
          ) : null}
          {photos.map((p, i) => (
            <View key={`${p.uri}-${i}`}>
              <Image source={{ uri: p.uri }} style={{ width: 64, height: 64, borderRadius: 8, backgroundColor: Colors.background.card }} contentFit="cover" />
              <RemoveChip label={t('social.composer.removePhoto')} onPress={() => setPhotos((current) => current.filter((_, j) => j !== i))} />
            </View>
          ))}
        </ScrollView>
      ) : null}

      {hint ? (
        <T step="caption" color={Colors.text.tertiary} align="center" style={{ paddingTop: 6 }}>
          {hint}
        </T>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8, paddingVertical: 8 }}>
        {voice ? (
          // A recorded note, waiting: listen, throw it away, or send it.
          <>
            <Touchable
              onPress={() => setVoice(null)}
              accessibilityRole="button"
              accessibilityLabel={t('social.voice.discard')}
              hitSlop={6}
              style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
            >
              <Trash2 size={20} color={Colors.status.error} />
            </Touchable>
            <View style={{ flex: 1, marginHorizontal: 4, borderRadius: 20, backgroundColor: Colors.background.medium, borderWidth: 1, borderColor: Colors.border.default }}>
              <VoiceBubble uri={voice.uri} durationMs={voice.durationMs} mine={false} />
            </View>
          </>
        ) : recording ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, height: 40, paddingHorizontal: 12 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.status.error }} />
            <T step="body" ltr>
              {formatDuration(recorderState.durationMillis)}
            </T>
            <T step="footnote" color={cancelling ? Colors.status.error : Colors.text.tertiary} style={{ flex: 1 }} align="center" numberOfLines={1}>
              {cancelling ? t('social.voice.releaseToCancel') : t('social.voice.slideToCancel')}
            </T>
          </View>
        ) : (
          <>
            <Touchable
              onPress={pick}
              disabled={!canAdd}
              accessibilityRole="button"
              accessibilityLabel={t('social.composer.addMedia')}
              hitSlop={6}
              style={({ pressed }) => ({ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', opacity: !canAdd ? 0.4 : pressed ? 0.6 : 1 })}
            >
              <ImagePlus size={22} color={Colors.darkGold} />
            </Touchable>
            <Touchable
              onPress={takePhoto}
              disabled={!canAdd}
              accessibilityRole="button"
              accessibilityLabel={t('social.composer.takePhoto')}
              hitSlop={6}
              style={({ pressed }) => ({ width: 36, height: 40, alignItems: 'center', justifyContent: 'center', opacity: !canAdd ? 0.4 : pressed ? 0.6 : 1 })}
            >
              <Camera size={22} color={Colors.darkGold} />
            </Touchable>

            <TextInput
              value={text}
              onChangeText={(value) => {
                setText(value);
                if (value.length) onTyping();
              }}
              placeholder={t('social.composer.placeholder')}
              placeholderTextColor={Colors.text.muted}
              multiline
              maxLength={BODY_MAX}
              accessibilityLabel={t('social.composer.placeholder')}
              style={{
                flex: 1,
                ...typeStyle('body', isArabic),
                color: Colors.text.primary,
                backgroundColor: Colors.background.medium,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: Colors.border.default,
                paddingHorizontal: 14,
                paddingTop: 9,
                paddingBottom: 9,
                maxHeight: 120,
                marginHorizontal: 4,
                textAlign: I18nManager.isRTL ? 'right' : 'left',
              }}
            />
          </>
        )}

        {showMic ? (
          <View
            {...mic.panHandlers}
            accessible
            accessibilityRole="button"
            accessibilityLabel={recording ? t('social.voice.stopRecording') : t('social.voice.record')}
            accessibilityHint={t('social.voice.recordHintScreenReader')}
            // Holding is not possible with a screen reader: a double-tap starts
            // the recording and another stops it for preview.
            onAccessibilityTap={() => void (recordingRef.current ? stopRecording(false) : startRecording())}
            style={{
              width: recording ? 52 : 40,
              height: recording ? 52 : 40,
              marginTop: recording ? -6 : 0,
              borderRadius: 26,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: recording ? (cancelling ? Colors.status.error : Colors.darkGold) : Colors.background.medium,
            }}
          >
            <Mic size={recording ? 24 : 20} color={recording ? Colors.text.dark : Colors.darkGold} />
          </View>
        ) : (
          <Touchable
            onPress={send}
            accessibilityRole="button"
            accessibilityLabel={t('social.composer.send')}
            style={({ pressed }) => ({
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: Colors.darkGold,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <ArrowUp size={20} color={Colors.text.dark} strokeWidth={2.6} />
          </Touchable>
        )}
      </View>
    </View>
  );
}

function RemoveChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={{ position: 'absolute', top: -6, end: -6, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background.light }}
    >
      <X size={12} color={Colors.text.primary} />
    </Touchable>
  );
}
