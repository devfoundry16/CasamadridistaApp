/**
 * MediaService.ts
 *
 * Handles client-side upload flow:
 *  1. Ask backend for a signed upload URL → { uploadUrl, mediaId, provider }
 *  2. Client-side compress image (expo-image-manipulator) or video (expo-video-thumbnails for poster)
 *  3. Send the bytes straight to the upload URL the way the slot asks: a PUT to a
 *     Supabase signed URL, or a multipart POST to Cloudflare Images or Stream
 *  4. Notify backend the upload is complete → /api/media/uploads/:id/complete
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImageManipulator from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system/legacy';
import { API_BASE_URL } from '@/config/supabase';
import { UPLOAD_METHODS, retryWhileIncomplete } from '@/utils/uploadTarget.core';
import { uploadToSlot } from './upload/uploadToSlot';

export interface UploadSlot {
  uploadUrl: string;
  mediaId: string;
  provider: string;
  externalId: string;
  /** 'POST' (multipart, field `field`) for a Cloudflare Images or Stream slot; absent for a PUT. */
  method?: string;
  field?: string;
  thumbnailUploadUrl?: string;
  thumbnailPublicUrl?: string;
}

export interface UploadedMedia {
  mediaId: string;
  localUri: string;
  kind: 'image' | 'video';
  thumbnailUri?: string;
  width?: number;
  height?: number;
}

const MAX_IMAGE_WIDTH = 1600;
const IMAGE_QUALITY   = 0.8;

class MediaServiceClass {
  private async getAuthHeader(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // ---- Compress ----

  async compressImage(localUri: string): Promise<{ uri: string; width: number; height: number }> {
    const result = await ImageManipulator.manipulateAsync(
      localUri,
      [{ resize: { width: MAX_IMAGE_WIDTH } }],
      { compress: IMAGE_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
    );
    return { uri: result.uri, width: result.width, height: result.height };
  }

  async generateVideoThumbnail(localUri: string): Promise<string | undefined> {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(localUri, { time: 500 });
      return uri;
    } catch {
      return undefined;
    }
  }

  // ---- Upload slot ----

  /**
   * `position` is the item's place in the post's carousel (0–9); the backend
   * returns `media[]` sorted by it.
   */
  async requestUploadSlot(kind: 'image' | 'video', postId: string, position?: number): Promise<UploadSlot> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.post<UploadSlot>(
        `${API_BASE_URL}media/uploads`,
        { kind, post_id: postId, upload_methods: UPLOAD_METHODS, ...(position !== undefined ? { position } : {}) },
        { headers }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get upload slot');
    }
  }

  // ---- Upload bytes (Supabase signed URL path) ----

  async uploadToSignedUrl(signedUrl: string, localUri: string, mimeType: string): Promise<void> {
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (!fileInfo.exists) throw new Error('File does not exist');

    // expo-file-system uploadAsync supports PUT with binary body
    const result = await FileSystem.uploadAsync(signedUrl, localUri, {
      httpMethod: 'PUT',
      headers: { 'Content-Type': mimeType },
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    });

    if (result.status >= 300) {
      throw new Error(`Upload failed with status ${result.status}`);
    }
  }

  // ---- Notify backend ----

  async completeUpload(
    mediaId: string,
    meta: { width?: number; height?: number; size_bytes?: number; duration_ms?: number; thumbnail_url?: string; blurhash?: string }
  ): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.post(`${API_BASE_URL}media/uploads/${mediaId}/complete`, meta, { headers });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to complete upload');
    }
  }

  // ---- Full image upload flow ----

  /**
   * Pass `slot` when it was reserved up front (see `Composer`): the post stays
   * pending until its last reserved item completes, and the backend refuses
   * new slots (409 `media_locked`) once any item has completed.
   */
  async uploadImage(
    localUri: string,
    postId: string,
    position = 0,
    slot?: UploadSlot,
    onProgress?: (fraction: number) => void,
  ): Promise<UploadedMedia> {
    // 1. Compress
    const compressed = await this.compressImage(localUri);

    // 2. Get upload slot, unless one was reserved already
    const uploadSlot = slot ?? await this.requestUploadSlot('image', postId, position);

    // 3. Upload bytes, the way the slot asks (PUT for Supabase, POST for Cloudflare)
    const status = await uploadToSlot(uploadSlot.uploadUrl, compressed.uri, uploadSlot, 'image/jpeg', onProgress);
    if (status >= 300) throw new Error(`Upload failed with status ${status}`);

    // 4. Complete. The backend derives image URLs from the storage key. A
    //    Cloudflare image can take a moment to leave its draft state.
    await retryWhileIncomplete(() => this.completeUpload(uploadSlot.mediaId, {
      width: compressed.width,
      height: compressed.height,
    }));

    return {
      mediaId:      uploadSlot.mediaId,
      localUri:     compressed.uri,
      kind:         'image',
      width:        compressed.width,
      height:       compressed.height,
    };
  }

  // ---- Full video upload flow ----
  // Cloudflare Stream: a one-time URL that takes a multipart POST (the slot
  // says so). Supabase: a signed URL that takes a plain PUT.

  /**
   * `slot`: as for `uploadImage`. `measured` is what the picker reported, sent
   * with the completion (a Stream video's own values arrive in its webhook).
   */
  async uploadVideo(
    localUri: string,
    postId: string,
    position = 0,
    slot?: UploadSlot,
    onProgress?: (fraction: number) => void,
    measured: { width?: number | null; height?: number | null; durationMs?: number | null; sizeBytes?: number | null } = {},
  ): Promise<UploadedMedia> {
    console.log('[MediaService] uploadVideo start', { postId });

    // 1. Generate local thumbnail for compose preview
    const thumbnailUri = await this.generateVideoThumbnail(localUri);
    console.log('[MediaService] thumbnail generated:', thumbnailUri ? 'yes' : 'no');

    // 2. Get upload slot, unless one was reserved already — backend returns
    //    signed URLs for both video and thumbnail
    const uploadSlot = slot ?? await this.requestUploadSlot('video', postId, position);
    console.log('[MediaService] upload slot ready, mediaId:', uploadSlot.mediaId,
      'hasThumbSlot:', !!uploadSlot.thumbnailUploadUrl);

    // 3. Upload the video bytes the way the slot asks (POST for Stream, PUT for Supabase)
    const status = await uploadToSlot(uploadSlot.uploadUrl, localUri, uploadSlot, 'video/mp4', onProgress);
    if (status >= 300) throw new Error(`Upload failed with status ${status}`);

    // 4. Upload thumbnail image to Supabase and get its public URL
    let publicThumbnailUrl: string | undefined;
    if (thumbnailUri && uploadSlot.thumbnailUploadUrl && uploadSlot.thumbnailPublicUrl) {
      try {
        await this.uploadToSignedUrl(uploadSlot.thumbnailUploadUrl, thumbnailUri, 'image/jpeg');
        publicThumbnailUrl = uploadSlot.thumbnailPublicUrl;
        console.log('[MediaService] thumbnail uploaded, publicUrl:', publicThumbnailUrl);
      } catch (e) {
        console.warn('[MediaService] thumbnail upload failed (non-fatal):', e);
      }
    }

    // 5. Notify backend — pass the server-issued thumbnail slot's public URL,
    //    never a local file URI (the backend accepts nothing else)
    const whole = (n: number | null | undefined) => (typeof n === 'number' && n > 0 ? Math.round(n) : undefined);
    await this.completeUpload(uploadSlot.mediaId, {
      thumbnail_url: publicThumbnailUrl,
      width: whole(measured.width),
      height: whole(measured.height),
      duration_ms: whole(measured.durationMs),
      size_bytes: whole(measured.sizeBytes),
    });
    console.log('[MediaService] completeUpload done');

    return {
      mediaId:      uploadSlot.mediaId,
      localUri,
      kind:         'video',
      thumbnailUri,
    };
  }
}

const MediaService = new MediaServiceClass();
export default MediaService;
