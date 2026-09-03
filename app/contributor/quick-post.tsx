import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Camera, ImagePlus, Video, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ContributorGate from '@/components/Contributor/ContributorGate';
import { matchDateLabel, matchLabel } from '@/components/Contributor/labels';
import Chip from '@/components/Team/Chip';
import PickerPill, { type PickerOption } from '@/components/Team/PickerPill';
import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { useContributorItemMutations } from '@/hooks/media/useMyContent';
import UploadManager from '@/services/upload/UploadManager';
import {
  captureWithCamera,
  inferItemType,
  pickFromLibrary,
  type PickResult,
  type PickedAsset,
} from '@/services/upload/pickMedia';
import type { ContributorMe } from '@/types/media/contributor';

const LAST_CATEGORY_KEY = 'casa_media_last_category';

export default function QuickPostScreen() {
  return (
    <ContributorGate returnTo="/contributor/quick-post">
      {(me) => <QuickPost me={me} />}
    </ContributorGate>
  );
}

/**
 * Quick Post — the stadium path.
 *
 * The picker opens on mount, before anything is rendered, because the
 * correspondent is standing in a stand with one hand free. Everything after it
 * has a sensible default (today's match, last-used category, the item type
 * inferred from the selection), so the shortest publish is: tap Quick Post,
 * pick, tap Publish.
 *
 * Nothing here waits on bytes. The item row and its asset slots are created up
 * front, the files go to `UploadManager`, and the submit carries
 * `publish_when_ready` so the worker publishes the moment the last transcode
 * lands — the phone can go in a pocket at that point.
 */
function QuickPost({ me }: { me: ContributorMe }) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { create, submit } = useContributorItemMutations();

  const [assets, setAssets] = useState<PickedAsset[]>([]);
  const [caption, setCaption] = useState('');
  const [matchId, setMatchId] = useState<number | null>(
    me.todayMatch?.id ?? me.allowedMatches[0]?.id ?? null,
  );
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const openedPicker = useRef(false);

  /* Last-used category, as the default. */
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(LAST_CATEGORY_KEY).then((stored) => {
      if (cancelled || !stored) return;
      if (me.allowedCategories.some((category) => category.id === stored)) setCategoryId(stored);
    });
    return () => {
      cancelled = true;
    };
  }, [me.allowedCategories]);

  const handlePickResult = useCallback(
    (result: PickResult, append: boolean) => {
      if (result.denied) {
        Alert.alert(
          t('contributor.errors.permissionTitle'),
          t(
            result.denied === 'camera'
              ? 'contributor.errors.cameraDenied'
              : 'contributor.errors.libraryDenied',
          ),
        );
        return;
      }
      if (result.rejected.length) {
        Alert.alert(
          t('contributor.errors.someRejectedTitle'),
          result.rejected
            .map((entry) => `${entry.name}: ${t(`contributor.errors.reason.${entry.reason}`)}`)
            .join('\n'),
        );
      }
      if (!result.assets.length) return;
      setAssets((current) => {
        const next = append ? [...current, ...result.assets] : result.assets;
        return next.slice(0, me.limits.maxGalleryAssets);
      });
    },
    [me.limits.maxGalleryAssets, t],
  );

  const openLibrary = useCallback(
    async (append: boolean) => {
      try {
        const result = await pickFromLibrary({
          limits: me.limits,
          selectionLimit: Math.max(1, me.limits.maxGalleryAssets - (append ? assets.length : 0)),
        });
        handlePickResult(result, append);
      } catch (error: any) {
        Alert.alert(t('contributor.errors.pickFailed'), error?.message ?? '');
      }
    },
    [assets.length, handlePickResult, me.limits, t],
  );

  const openCamera = useCallback(
    async (video: boolean) => {
      try {
        const result = await captureWithCamera({ limits: me.limits, video });
        handlePickResult(result, true);
      } catch (error: any) {
        Alert.alert(t('contributor.errors.pickFailed'), error?.message ?? '');
      }
    },
    [handlePickResult, me.limits, t],
  );

  /* The picker opens itself, once. */
  useEffect(() => {
    if (openedPicker.current) return;
    openedPicker.current = true;
    void openLibrary(false);
  }, [openLibrary]);

  const matchOptions: PickerOption<number>[] = me.allowedMatches.map((match) => ({
    value: match.id,
    label: matchLabel(match, `#${match.id}`),
    caption: matchDateLabel(match) ?? undefined,
    iconUri: match.league_logo ?? undefined,
  }));

  const publish = useCallback(async () => {
    if (!assets.length) {
      Alert.alert(t('contributor.errors.noAssetsTitle'), t('contributor.errors.noAssetsBody'));
      return;
    }
    if (!matchId) {
      Alert.alert(t('contributor.errors.noMatchTitle'), t('contributor.errors.noMatchBody'));
      return;
    }

    setBusy(true);
    try {
      const item = await create.mutateAsync({
        type: inferItemType(assets),
        match_id: matchId,
        category_id: categoryId,
        caption: caption.trim() || null,
        short_description: caption.trim().slice(0, 400) || null,
      });

      const entryIds = await UploadManager.enqueue(
        assets.map((asset, index) => ({
          itemId: item.id,
          kind: asset.kind,
          localUri: asset.uri,
          mime: asset.mime,
          position: index,
          width: asset.width,
          height: asset.height,
          durationMs: asset.durationMs,
          sizeBytes: asset.sizeBytes,
        })),
        // Hold the pump until the slots below are reserved, so no worker races
        // `reserveSlots` into minting a second slot for the same file.
        { autoStart: false },
      );

      // A file that could not be copied out of the picker's cache is a hard
      // failure — nothing will ever upload it. Leave the item as a draft so the
      // caption and the other files are not lost, and say so.
      const brokeInPrepare = UploadManager.entriesByIds(entryIds).filter(
        (entry) => entry.status === 'failed',
      );
      if (brokeInPrepare.length) {
        Alert.alert(
          t('contributor.errors.prepareFailedTitle'),
          `${t('contributor.errors.prepareFailedBody')}\n\n${
            brokeInPrepare[0].error ?? ''
          }`,
        );
        UploadManager.resume();
        router.replace({ pathname: '/contributor/create', params: { id: item.id } });
        return;
      }

      // `publish_when_ready` hands the item to the worker, which publishes once
      // every **asset row** is ready — so every entry must own one before the
      // submit, or a file with no row is silently left out of the published
      // item. Reserving the slots up front is what makes that true; it does not
      // wait for a single byte.
      await UploadManager.reserveSlots(entryIds);
      const queue = UploadManager.readinessFor(entryIds);

      if (!queue.canPublishWhenReady) {
        Alert.alert(
          t('contributor.errors.reserveFailedTitle'),
          t('contributor.errors.reserveFailedBody'),
        );
        router.replace({ pathname: '/contributor/create', params: { id: item.id } });
        return;
      }

      await submit.mutateAsync({
        id: item.id,
        input: {
          publish_now: !me.requiresApproval,
          publish_when_ready: true,
          notify_mode: 'digest',
        },
      });

      if (categoryId) void AsyncStorage.setItem(LAST_CATEGORY_KEY, categoryId);

      // See create.tsx: replace would leave the launching `/contributor`
      // buried under a second copy of itself.
      router.dismissTo('/contributor');
    } catch (error: any) {
      Alert.alert(t('contributor.errors.publishFailed'), error?.message ?? '');
    } finally {
      setBusy(false);
    }
  }, [assets, caption, categoryId, create, matchId, me.requiresApproval, router, submit, t]);

  const ctaLabel = me.requiresApproval
    ? t('contributor.quickPost.submit')
    : t('contributor.quickPost.publish');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background.dark }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* ── Selection ─────────────────────────────────────── */}
        <View className="pt-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
          >
            {/* Leading, not trailing: these used to sit after every selected
                thumbnail in a horizontally scrolling strip, so once a few photos
                were picked the camera was off-screen and looked missing. */}
            <Touchable
              onPress={() => void openLibrary(true)}
              accessibilityRole="button"
              accessibilityLabel={t('contributor.quickPost.addMore')}
              style={({ pressed }) => ({
                width: 88,
                height: 88,
                borderRadius: 10,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: Colors.border.light,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <ImagePlus size={20} color={Colors.darkGold} />
              <Text className="text-[11px] mt-1" style={{ color: Colors.text.tertiary }}>
                {t('contributor.quickPost.addMore')}
              </Text>
            </Touchable>

            <Touchable
              onPress={() => void openCamera(false)}
              accessibilityRole="button"
              accessibilityLabel={t('contributor.quickPost.camera')}
              style={({ pressed }) => ({
                width: 88,
                height: 88,
                borderRadius: 10,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: Colors.border.light,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Camera size={20} color={Colors.darkGold} />
              <Text className="text-[11px] mt-1" style={{ color: Colors.text.tertiary }}>
                {t('contributor.quickPost.camera')}
              </Text>
            </Touchable>

            {assets.map((asset, index) => (
              <View key={`${asset.uri}-${index}`} style={{ width: 88 }}>
                <View
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 10,
                    overflow: 'hidden',
                    backgroundColor: Colors.background.light,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {asset.kind === 'image' ? (
                    <Image
                      source={{ uri: asset.uri }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                      transition={0}
                    />
                  ) : (
                    <Video size={22} color={Colors.text.tertiary} />
                  )}
                  <Touchable
                    onPress={() =>
                      setAssets((current) => current.filter((_, other) => other !== index))
                    }
                    accessibilityRole="button"
                    accessibilityLabel={t('contributor.assets.remove')}
                    hitSlop={8}
                    style={{
                      position: 'absolute',
                      top: 4,
                      // Logical, not `right`: the badge belongs on the
                      // trailing corner in both directions.
                      end: 4,
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      borderRadius: 10,
                      padding: 3,
                    }}
                  >
                    <X size={12} color={Colors.text.primary} />
                  </Touchable>
                </View>
              </View>
            ))}

          </ScrollView>

          {!assets.length ? (
            <Text className="px-4 pt-3 text-[13px]" style={{ color: Colors.text.muted }}>
              {t('contributor.quickPost.pickPrompt')}
            </Text>
          ) : null}
        </View>

        {/* ── Match ─────────────────────────────────────────── */}
        <View className="px-4 pt-5">
          <Text className="text-[12px] font-semibold mb-2" style={{ color: Colors.text.tertiary }}>
            {t('contributor.create.match')}
          </Text>
          <PickerPill
            title={t('contributor.create.match')}
            options={matchOptions}
            value={matchId ?? -1}
            onChange={setMatchId}
            placeholder={t('contributor.create.selectMatch')}
            disabled={busy || !matchOptions.length}
            maxWidth={280}
          />
        </View>

        {/* ── Caption ───────────────────────────────────────── */}
        <View className="px-4 pt-5">
          <Text className="text-[12px] font-semibold mb-2" style={{ color: Colors.text.tertiary }}>
            {t('contributor.create.caption')}
          </Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder={t('contributor.quickPost.captionPlaceholder')}
            placeholderTextColor={Colors.text.muted}
            multiline
            editable={!busy}
            style={styles.caption}
          />
        </View>

        {/* ── Category ──────────────────────────────────────── */}
        {me.allowedCategories.length ? (
          <View className="px-4 pt-5">
            <Text
              className="text-[12px] font-semibold mb-2"
              style={{ color: Colors.text.tertiary }}
            >
              {t('contributor.create.category')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {me.allowedCategories.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  active={categoryId === category.id}
                  onPress={() =>
                    setCategoryId((current) => (current === category.id ? null : category.id))
                  }
                />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <View
        className="px-4 pt-3"
        style={{
          paddingBottom: insets.bottom + 12,
          borderTopWidth: 1,
          borderTopColor: Colors.border.default,
          backgroundColor: Colors.background.deepDark,
        }}
      >
        <Touchable
          onPress={() => void publish()}
          disabled={busy || !assets.length}
          accessibilityRole="button"
          style={({ pressed }) => ({
            height: 50,
            borderRadius: 25,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            backgroundColor: Colors.darkGold,
            opacity: busy || !assets.length ? 0.5 : pressed ? 0.85 : 1,
          })}
        >
          {busy ? <ActivityIndicator size="small" color={Colors.text.dark} /> : null}
          <Text className="text-[15px] font-bold" style={{ color: Colors.text.dark }}>
            {ctaLabel}
          </Text>
        </Touchable>
        <Text className="text-[11px] text-center mt-2" style={{ color: Colors.text.muted }}>
          {t('contributor.quickPost.backgroundHint')}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  caption: {
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text.primary,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
    // Follows the caption's own script rather than the app direction.
    textAlign: 'auto',
  },
});
