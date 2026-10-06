import * as FileSystem from 'expo-file-system/legacy';

import { uploadPlan, type SlotTarget } from '../../utils/uploadTarget.core';

/**
 * Send a local file to an upload slot the way the slot asks: a raw PUT for
 * Supabase, a multipart POST for Cloudflare Images (utils/uploadTarget.core.ts).
 * Returns the HTTP status; a status of 300 or more is a failed upload.
 */
export async function uploadToSlot(url: string, localUri: string, target: SlotTarget, mimeType: string): Promise<number> {
  const plan = uploadPlan(target, mimeType);
  const result = plan.kind === 'multipart'
    ? await FileSystem.uploadAsync(url, localUri, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: plan.fieldName,
        mimeType: plan.mimeType,
      })
    : await FileSystem.uploadAsync(url, localUri, {
        httpMethod: 'PUT',
        headers: plan.headers,
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      });
  return result.status;
}
