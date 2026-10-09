import * as FileSystem from 'expo-file-system/legacy';

import { uploadPlan, type SlotTarget } from '../../utils/uploadTarget.core';

/**
 * Send a local file to an upload slot the way the slot asks: a raw PUT for
 * Supabase, a multipart POST for Cloudflare Images and Stream
 * (utils/uploadTarget.core.ts). Returns the HTTP status; a status of 300 or
 * more is a failed upload.
 *
 * `onProgress` gets the fraction sent (0..1) as the bytes go out.
 */
export async function uploadToSlot(
  url: string,
  localUri: string,
  target: SlotTarget,
  mimeType: string,
  onProgress?: (fraction: number) => void,
): Promise<number> {
  const plan = uploadPlan(target, mimeType);
  const options: FileSystem.FileSystemUploadOptions = plan.kind === 'multipart'
    ? {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: plan.fieldName,
        mimeType: plan.mimeType,
      }
    : {
        httpMethod: 'PUT',
        headers: plan.headers,
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      };
  const task = FileSystem.createUploadTask(url, localUri, options, ({ totalBytesSent, totalBytesExpectedToSend }) => {
    if (onProgress && totalBytesExpectedToSend > 0) onProgress(totalBytesSent / totalBytesExpectedToSend);
  });
  const result = await task.uploadAsync();
  if (!result) throw new Error('Upload cancelled');
  return result.status;
}
