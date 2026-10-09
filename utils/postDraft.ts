import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

import { draftKey, isDraftEmpty, parseDraft, serializeDraft, unreferencedFiles, type PostDraft } from './postDraft.core';

/**
 * Where a post draft lives: the JSON in AsyncStorage, the media as copies in
 * the documents folder (a picked file sits in the cache, which iOS may clear
 * between launches). The rules are in postDraft.core.ts.
 */

const dirFor = (userId: string) => `${FileSystem.documentDirectory}post-drafts/${userId}/`;

/** The saved draft, without any media whose copy has gone missing. Never throws. */
export async function loadDraft(userId: string): Promise<PostDraft | null> {
  try {
    const draft = parseDraft(await AsyncStorage.getItem(draftKey(userId)));
    if (!draft) return null;
    const present = await Promise.all(draft.media.map((m) => FileSystem.getInfoAsync(m.uri).then((i) => i.exists).catch(() => false)));
    return { ...draft, media: draft.media.filter((_, i) => present[i]) };
  } catch {
    return null;
  }
}

/** Save, or forget the draft when there is nothing in it. Never throws. */
export async function saveDraft(userId: string, draft: PostDraft): Promise<void> {
  try {
    if (isDraftEmpty(draft)) {
      await clearDraft(userId);
      return;
    }
    await AsyncStorage.setItem(draftKey(userId), serializeDraft(draft));
    // Only what the draft still uses stays: a photo removed while drafting goes.
    const dir = dirFor(userId);
    const names = await FileSystem.readDirectoryAsync(dir).catch(() => [] as string[]);
    await Promise.all(
      unreferencedFiles(names, dir, draft).map((n) => FileSystem.deleteAsync(dir + n, { idempotent: true })),
    );
  } catch {
    // A draft is a convenience; losing one must never break posting.
  }
}

/** Forget the draft and every file copied for it. Never throws. */
export async function clearDraft(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(draftKey(userId));
    await FileSystem.deleteAsync(dirFor(userId), { idempotent: true });
  } catch {
    // Nothing to clean up is fine.
  }
}

/**
 * A copy of a picked file that survives a restart, in the draft's folder.
 * A file already there is returned as is.
 */
export async function keepDraftFile(userId: string, uri: string): Promise<string> {
  const dir = dirFor(userId);
  if (uri.startsWith(dir)) return uri;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext && ext.length <= 5 ? `.${ext}` : ''}`;
  await FileSystem.copyAsync({ from: uri, to: dir + name });
  return dir + name;
}
