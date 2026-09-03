import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
// NEW FileSystem API. `expo-file-system/legacy` is the deprecated one and its
// top-level helpers throw at runtime — do not mix the two in this module.
import { File, Paths } from 'expo-file-system';
import { downloadFileName } from '@/utils/media';

/**
 * Everything this hook needs from a media row. Community posts and Casa Media
 * assets both satisfy it, so one download/share path serves both.
 */
export type DownloadableMedia = { id: string };

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type PermissionOutcome = 'granted' | 'denied' | 'blocked';

/**
 * `File.downloadFileAsync` resolves to the base file type declared in
 * expo-file-system's native-module types, which is NOT the same declaration as
 * the exported `File` class (that one adds `name`, `extension`, etc.). Annotate
 * from the call signature so the two never drift — and so the global DOM `File`
 * can't be picked up by mistake.
 */
type DownloadedFile = Awaited<ReturnType<typeof File.downloadFileAsync>>;

/**
 * writeOnly: true → iOS asks only for "Add Photos Only", backed by
 * NSPhotoLibraryAddUsageDescription. Requesting add-only WITHOUT that key in
 * Info.plist hard-crashes the app on iOS, so app.json must ship it.
 */
async function ensureSavePermission(): Promise<PermissionOutcome> {
  const current = await MediaLibrary.getPermissionsAsync(true);
  // iOS "limited" (user picked specific photos) still permits add-only writes.
  if (current.granted || current.accessPrivileges === 'limited') return 'granted';
  if (!current.canAskAgain) return 'blocked';

  const next = await MediaLibrary.requestPermissionsAsync(true);
  if (next.granted || next.accessPrivileges === 'limited') return 'granted';
  return next.canAskAgain ? 'denied' : 'blocked';
}

/**
 * Android 10+ (API 29+) writes through MediaStore and needs no runtime grant;
 * `writeOnly` maps to WRITE_EXTERNAL_STORAGE, which is un-requestable on 33+.
 * Treat a "denied" there as non-fatal and let the save attempt decide.
 */
function permissionIsFatal(outcome: PermissionOutcome): boolean {
  if (outcome === 'granted') return false;
  if (Platform.OS === 'android' && Number(Platform.Version) >= 29) return false;
  return true;
}

export function useDownloadMedia() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<SaveStatus>('idle');
  const inFlight = useRef(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  const flash = useCallback((next: SaveStatus) => {
    setStatus(next);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStatus('idle'), 2400);
  }, []);

  /** Download to cache, hand to the share sheet, then delete the temp file. */
  const shareFile = useCallback(async (url: string, media: DownloadableMedia) => {
    let file: DownloadedFile | null = null;
    try {
      if (!(await Sharing.isAvailableAsync())) return;
      file = await File.downloadFileAsync(
        url,
        new File(Paths.cache, downloadFileName(media, url, Date.now())),
        { idempotent: true },
      );
      await Sharing.shareAsync(file.uri, {
        mimeType: file.type || 'image/jpeg',
        UTI: 'public.image',
      });
    } catch {
      /* user dismissed the sheet, or the download failed */
    } finally {
      try {
        if (file?.exists) file.delete();
      } catch {
        /* cache eviction is best-effort */
      }
    }
  }, []);

  const promptPermanentlyDenied = useCallback(
    (url: string, media: DownloadableMedia) => {
      Alert.alert(
        t('community.photoPermissionTitle'),
        t('community.photoPermissionBlockedMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('community.photoShareInstead'),
            onPress: () => {
              void shareFile(url, media);
            },
          },
          {
            text: t('community.photoPermissionOpenSettings'),
            onPress: () => {
              void Linking.openSettings();
            },
          },
        ],
      );
    },
    [shareFile, t],
  );

  const save = useCallback(
    async (url: string, media: DownloadableMedia, options?: { shareOnly?: boolean }) => {
      if (inFlight.current) return; // guard double-taps
      inFlight.current = true;

      // Web build (`web.output: 'static'`).
      if (Platform.OS === 'web') {
        try {
          if (typeof document !== 'undefined') {
            const link = document.createElement('a');
            link.href = url;
            link.download = downloadFileName(media, url, Date.now());
            link.target = '_blank';
            link.rel = 'noopener';
            link.click();
            flash('saved');
          }
        } finally {
          inFlight.current = false;
        }
        return;
      }

      if (options?.shareOnly) {
        setStatus('saving');
        try {
          await shareFile(url, media);
        } finally {
          setStatus('idle');
          inFlight.current = false;
        }
        return;
      }

      setStatus('saving');
      let file: DownloadedFile | null = null;
      try {
        const outcome = await ensureSavePermission();
        if (outcome === 'blocked' && permissionIsFatal(outcome)) {
          setStatus('idle');
          promptPermanentlyDenied(url, media);
          return;
        }
        if (outcome === 'denied' && permissionIsFatal(outcome)) {
          setStatus('idle');
          Alert.alert(t('community.photoPermissionTitle'), t('community.photoPermissionMessage'));
          return;
        }

        // NOTE: the new FileSystem API exposes no progress callback
        // (DownloadOptions = { headers?, idempotent? }), so the UI shows an
        // indeterminate spinner. Pass `headers` here if public_url ever
        // becomes a signed/authenticated URL.
        const destination = new File(Paths.cache, downloadFileName(media, url, Date.now()));
        file = await File.downloadFileAsync(url, destination, { idempotent: true });

        // saveToLibraryAsync copies the bytes into the library, so deleting the
        // cache copy right after the await is safe. It is also add-only
        // friendly (unlike createAssetAsync + album, which needs full access
        // and fails under iOS "limited").
        await MediaLibrary.saveToLibraryAsync(file.uri);

        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        flash('saved');
      } catch (error) {
        if (__DEV__) console.warn('[useDownloadMedia] save failed', error);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        flash('error');
        Alert.alert(t('common.error'), t('community.photoSaveFailed'), [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('community.photoShareInstead'),
            onPress: () => {
              void shareFile(url, media);
            },
          },
        ]);
      } finally {
        try {
          if (file?.exists) file.delete();
        } catch {
          /* best-effort cleanup */
        }
        inFlight.current = false;
      }
    },
    [flash, promptPermanentlyDenied, shareFile, t],
  );

  return { save, status, isSaving: status === 'saving' };
}
