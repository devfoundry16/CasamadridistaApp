/**
 * MediaService.ts
 *
 * Handles client-side upload flow:
 *  1. Ask backend for a signed upload URL → { uploadUrl, mediaId, provider }
 *  2. Client-side compress image (expo-image-manipulator) or video (expo-video-thumbnails for poster)
 *  3. PUT compressed bytes directly to the upload URL (Supabase signed URL or CF Stream TUS)
 *  4. Notify backend the upload is complete → /api/media/uploads/:id/complete
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as ImageManipulator from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system/legacy';
import { API_BASE_URL } from '@/config/supabase';

export interface UploadSlot {
  uploadUrl: string;
  mediaId: string;
  provider: string;
  externalId: string;
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

  async requestUploadSlot(kind: 'image' | 'video', postId: string): Promise<UploadSlot> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.post<UploadSlot>(
        `${API_BASE_URL}media/uploads`,
        { kind, post_id: postId },
        { headers }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get upload slot');
    }
  }

  // ---- Upload bytes (Supabase signed URL path) ----

  async uploadToSignedUrl(signedUrl: string, localUri: string, mimeType: string): Promise<void> {
    const fileInfo = await FileSystem.getInfoAsync(localUri, { size: true });
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
    meta: { width?: number; height?: number; size_bytes?: number; thumbnail_url?: string; blurhash?: string }
  ): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.post(`${API_BASE_URL}media/uploads/${mediaId}/complete`, meta, { headers });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to complete upload');
    }
  }

  // ---- Full image upload flow ----

  async uploadImage(localUri: string, postId: string): Promise<UploadedMedia> {
    // 1. Compress
    const compressed = await this.compressImage(localUri);

    // 2. Get upload slot
    const slot = await this.requestUploadSlot('image', postId);

    // 3. Upload bytes
    await this.uploadToSignedUrl(slot.uploadUrl, compressed.uri, 'image/jpeg');

    // 4. Complete
    await this.completeUpload(slot.mediaId, {
      width: compressed.width,
      height: compressed.height,
      thumbnail_url: undefined, // backend derives from storage_key
    });

    return {
      mediaId:      slot.mediaId,
      localUri:     compressed.uri,
      kind:         'image',
      width:        compressed.width,
      height:       compressed.height,
    };
  }

  // ---- Full video upload flow ----
  // For Cloudflare Stream (TUS), the uploadUrl is a TUS endpoint.
  // For Supabase, it's a signed URL (plain PUT).

  async uploadVideo(localUri: string, postId: string): Promise<UploadedMedia> {
    // 1. Get thumbnail poster
    const thumbnailUri = await this.generateVideoThumbnail(localUri);

    // 2. Get upload slot
    const slot = await this.requestUploadSlot('video', postId);

    // 3. Upload (Supabase signed URL — PUT)
    // CF Stream TUS requires the tus-js-client library on React Native;
    // for now we use the Supabase path universally, and CF Stream is handled
    // server-side when MEDIA_PROVIDER=cloudflare_stream (TUS via CF dashboard or SDK).
    await this.uploadToSignedUrl(slot.uploadUrl, localUri, 'video/mp4');

    // 4. Complete
    await this.completeUpload(slot.mediaId, {
      thumbnail_url: thumbnailUri,
    });

    return {
      mediaId:      slot.mediaId,
      localUri,
      kind:         'video',
      thumbnailUri,
    };
  }
}

const MediaService = new MediaServiceClass();
export default MediaService;
