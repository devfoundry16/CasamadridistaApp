import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import SocialService, { SocialApiError } from '@/services/SocialService';
import type { UserStoryGroup } from '@/types/social';
import { uploadMimeType } from '@/utils/stories.core';
import { socialKeys } from './keys';

const feedKey = [...socialKeys.all, 'stories'] as const;
const userKey = (userId: string) => [...socialKeys.all, 'stories', 'user', userId] as const;

/** The stories row: your own, friends', then everyone's (C1). */
export function useStoryFeed() {
  return useQuery<UserStoryGroup[]>({ queryKey: feedKey, queryFn: () => SocialService.storyFeed(), staleTime: 30_000 });
}

/** One person's live stories (their profile ring, their viewer). */
export function useUserStories(userId: string | undefined) {
  return useQuery({
    queryKey: userKey(userId ?? ''),
    queryFn: () => SocialService.userStories(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export interface PickedMedia {
  uri: string;
  type: 'image' | 'video';
  mimeType?: string | null;
  width?: number;
  height?: number;
  durationMs?: number | null;
}

const PHOTO_MAX_EDGE = 1920;

/**
 * Post a story: reserve it, upload the file straight to storage (a photo to
 * the private bucket, a video to Stream), then publish with the caption. A
 * video is live once Stream has processed it.
 */
export function usePostStory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ media, caption }: { media: PickedMedia; caption: string }) => {
      let uri = media.uri;
      let width = media.width;
      let height = media.height;
      let mime = uploadMimeType(media);
      if (media.type === 'image') {
        const longest = Math.max(width ?? 0, height ?? 0);
        const resize = longest > PHOTO_MAX_EDGE
          ? [{ resize: (width ?? 0) >= (height ?? 0) ? { width: PHOTO_MAX_EDGE } : { height: PHOTO_MAX_EDGE } }]
          : [];
        const prepared = await ImageManipulator.manipulateAsync(uri, resize, { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG });
        ({ uri, width, height } = prepared);
        mime = 'image/jpeg';
      }
      const info = await FileSystem.getInfoAsync(uri);
      const size = info.exists && typeof info.size === 'number' ? info.size : 0;
      const slot = await SocialService.createStorySlot({
        kind: media.type === 'image' ? 'photo' : 'video',
        mime_type: mime,
        size_bytes: size,
        width,
        height,
        ...(media.type === 'video' && media.durationMs ? { duration_ms: Math.round(media.durationMs) } : {}),
      });
      const result = slot.method === 'PUT'
        ? await FileSystem.uploadAsync(slot.upload_url, uri, {
            httpMethod: 'PUT',
            headers: { 'Content-Type': mime },
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          })
        : await FileSystem.uploadAsync(slot.upload_url, uri, {
            httpMethod: 'POST',
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            fieldName: 'file',
            mimeType: mime,
          });
      if (result.status >= 300) throw new SocialApiError('upload_failed', result.status);
      return SocialService.publishStory(slot.story_id, caption.trim() || null);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: feedKey }),
  });
}

export function useStoryActions() {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: feedKey });
  return {
    view: (id: string) => SocialService.viewStory(id).catch(() => {}),
    remove: async (id: string) => {
      await SocialService.deleteStory(id);
      await refresh();
    },
    mute: async (userId: string) => {
      await SocialService.muteStories(userId, true);
      await refresh();
    },
    reply: (id: string, input: { body?: string; reaction?: string }) =>
      SocialService.replyToStory(id, { ...input, client_id: Crypto.randomUUID() }),
    refresh,
  };
}
