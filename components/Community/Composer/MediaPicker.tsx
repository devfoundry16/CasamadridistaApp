import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Camera, Crop, Image as ImageIcon, Images, Play, Video, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Touchable from '@/components/Touchable';
import ActionSheet, { type SheetAction } from '@/components/Social/ActionSheet';
import { captureWithCamera, pickFromLibrary, type PickResult } from '@/services/upload/pickMedia';
import {
  POST_MEDIA_LIMITS,
  cameraOptions,
  libraryCropRequest,
  libraryRequest,
  mergePostMedia,
  type PickedAsset,
} from '@/utils/mediaPick.core';

/** A picked file plus, for a video, a still frame for the tray. */
export interface PickedMedia extends PickedAsset {
  thumbnailUri?: string;
}

interface Props {
  media: PickedMedia[];
  onChange: (media: PickedMedia[]) => void;
  disabled?: boolean;
  /** Open the library once on arrival, on photos or on videos (Create → Photo / Video). */
  start?: 'images' | 'videos' | null;
}

const THUMB = 72;

async function withThumbnail(asset: PickedAsset): Promise<PickedMedia> {
  if (asset.kind !== 'video') return asset;
  try {
    const { uri } = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 500 });
    return { ...asset, thumbnailUri: uri };
  } catch {
    return asset;
  }
}

/**
 * The composer's media tray: up to 10 photos, or exactly one video, from the
 * library (multi-select, in the order tapped) or the camera.
 *
 * The OS crop is offered on camera stills and on one library photo at a time
 * ("One photo, cropped", `libraryCropRequest`). Neither platform can crop
 * inside a multi-select, so "Choose photos" stays multi-select and uncropped
 * (see `libraryRequest`).
 *
 * The thumbnail strip follows `components/Social/Composer.tsx`.
 */
export default function MediaPicker({ media, onChange, disabled = false, start = null }: Props) {
  const { t } = useTranslation();
  const [cameraMenu, setCameraMenu] = useState(false);
  const [libraryMenu, setLibraryMenu] = useState(false);

  const library = libraryRequest(media);
  const camera = cameraOptions(media);
  const crop = libraryCropRequest(media);

  const take = async (result: PickResult) => {
    if (result.denied) {
      Alert.alert(t('account.permissionDenied'), t('account.grantAccess'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('community.photoPermissionOpenSettings'), onPress: () => void Linking.openSettings() },
      ]);
      return;
    }
    if (result.rejected.length) {
      Alert.alert(
        t('community.mediaRejectedTitle'),
        result.rejected.map((r) => `${r.name}: ${t(`community.mediaRejected.${r.reason}`)}`).join('\n'),
      );
    }
    if (!result.assets.length) return;

    const incoming = await Promise.all(result.assets.map(withThumbnail));
    const { assets, dropped } = mergePostMedia(media, incoming);
    if (dropped) Alert.alert(t('community.mediaLimitTitle'), t('community.mediaLimitBody'));
    onChange(assets);
  };

  const openLibrary = async (only?: 'images' | 'videos') => {
    const request = only ? libraryRequest(media, undefined, only) : library;
    if (!request) return;
    try {
      await take(
        await pickFromLibrary({
          limits: POST_MEDIA_LIMITS,
          selectionLimit: request.selectionLimit,
          mediaTypes: request.mediaTypes,
        }),
      );
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message ?? '');
    }
  };

  const openCropped = async () => {
    if (!crop) return;
    try {
      await take(await pickFromLibrary({ limits: POST_MEDIA_LIMITS, ...crop }));
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message ?? '');
    }
  };

  // Library always asks: a crop is possible exactly when the library is
  // (libraryCropRequest). The first row is named by what it opens.
  const libraryActions: SheetAction[] = [
    {
      key: 'photos',
      label: media.length ? t('community.libraryPhotos') : t('community.libraryPhotosOrVideo'),
      icon: <Images size={20} color={Colors.darkGold} />,
      onPress: () => void openLibrary(),
    },
    { key: 'crop', label: t('community.libraryCrop'), icon: <Crop size={20} color={Colors.darkGold} />, onPress: () => void openCropped() },
  ];
  const onLibrary = () => setLibraryMenu(true);

  const started = useRef(false);
  useEffect(() => {
    if (!start || started.current) return;
    started.current = true;
    void openLibrary(start);
    // Once, on arrival only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start]);

  const openCamera = async (video: boolean) => {
    try {
      await take(await captureWithCamera({ limits: POST_MEDIA_LIMITS, video, allowsEditing: !video }));
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message ?? '');
    }
  };

  const cameraActions: SheetAction[] = [
    ...(camera.photo
      ? [{ key: 'photo', label: t('community.takePhoto'), icon: <Camera size={20} color={Colors.darkGold} />, onPress: () => void openCamera(false) }]
      : []),
    ...(camera.video
      ? [{ key: 'video', label: t('community.recordVideo'), icon: <Video size={20} color={Colors.darkGold} />, onPress: () => void openCamera(true) }]
      : []),
  ];

  const onCamera = () => {
    // Only one thing the camera can add: skip the menu.
    if (cameraActions.length === 1) cameraActions[0].onPress();
    else if (cameraActions.length) setCameraMenu(true);
  };

  const remove = (index: number) => onChange(media.filter((_, i) => i !== index));

  const hasVideo = media.some((m) => m.kind === 'video');

  return (
    <View>
      {media.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14, gap: 10 }}
        >
          {media.map((m, i) => (
            <View key={`${m.uri}-${i}`}>
              <Image
                source={{ uri: m.thumbnailUri ?? m.uri }}
                style={{ width: THUMB, height: THUMB, borderRadius: 8, backgroundColor: Colors.background.medium }}
                contentFit="cover"
                accessibilityLabel={m.kind === 'video' ? t('community.video') : t('community.photoNumber', { number: i + 1 })}
              />
              {m.kind === 'video' ? (
                <View
                  pointerEvents="none"
                  style={{ position: 'absolute', bottom: 4, start: 4, borderRadius: 10, padding: 3, backgroundColor: 'rgba(0,0,0,0.6)' }}
                >
                  <Play size={10} color="#fff" fill="#fff" />
                </View>
              ) : null}
              <Touchable
                onPress={() => remove(i)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={m.kind === 'video' ? t('community.removeVideo') : t('social.composer.removePhoto')}
                hitSlop={8}
                style={{ position: 'absolute', top: -6, end: -6, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background.light }}
              >
                <X size={12} color={Colors.text.primary} />
              </Touchable>
            </View>
          ))}
        </ScrollView>
      ) : null}

      {!hasVideo && media.length ? (
        <Text className="px-4" style={{ color: Colors.text.tertiary, fontSize: 12, marginTop: -6, marginBottom: 10 }}>
          {t('community.photoCount', { current: media.length, max: POST_MEDIA_LIMITS.maxGalleryAssets })}
        </Text>
      ) : null}

      {library || cameraActions.length ? (
        <View className="flex-row px-4 gap-3" style={{ paddingBottom: 14 }}>
          {library ? (
            <TouchableOpacity
              onPress={onLibrary}
              disabled={disabled}
              className="flex-row items-center rounded-full px-4 py-2"
              style={{ backgroundColor: Colors.background.medium }}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <ImageIcon size={16} color={Colors.darkGold} />
              <Text className="text-sm" style={{ color: Colors.text.primary, marginStart: 8 }}>
                {media.length ? t('community.addMore') : t('community.library')}
              </Text>
            </TouchableOpacity>
          ) : null}
          {cameraActions.length ? (
            <TouchableOpacity
              onPress={onCamera}
              disabled={disabled}
              className="flex-row items-center rounded-full px-4 py-2"
              style={{ backgroundColor: Colors.background.medium }}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Camera size={16} color={Colors.darkGold} />
              <Text className="text-sm" style={{ color: Colors.text.primary, marginStart: 8 }}>
                {t('community.camera')}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <ActionSheet visible={cameraMenu} onClose={() => setCameraMenu(false)} cancelLabel={t('common.cancel')} actions={cameraActions} />
      <ActionSheet visible={libraryMenu} onClose={() => setLibraryMenu(false)} cancelLabel={t('common.cancel')} actions={libraryActions} />
    </View>
  );
}
