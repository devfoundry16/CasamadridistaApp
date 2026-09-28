import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@/config/supabase';
import i18n from '@/i18n';
import type { SocialReportReason } from '@/types/social';
import { reportErrorKey } from '@/utils/post.core';

/**
 * Casa Media's report reasons (`CasaMediaService.report`). Posts and comments
 * no longer use these; see `PostReportReason`.
 */
export type ReportReason = 'spam' | 'nudity' | 'violence' | 'hate' | 'misinformation' | 'other';

/**
 * Posts and comments are reported with the eight social reasons, the same as
 * messages and profiles. `other` needs a description.
 */
export type PostReportReason = SocialReportReason;

/**
 * The server's refusals the person can act on (`invalid_reason`,
 * `details_required`, `already_reported`) become a sentence in their language;
 * anything else keeps the raw code, as before.
 */
function reportError(error: any, fallback: string): Error {
  const code = error?.response?.data?.error;
  const key = reportErrorKey(code);
  // `code` rides along so the sheet can tell "already reported" (close) from
  // a mistake the person can fix (stay open).
  return Object.assign(new Error(key ? i18n.t(key) : code || fallback), { code: code ?? null });
}

class ReportServiceClass {
  private async getAuthHeader(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async reportPost(postId: string, reason: PostReportReason, description?: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.post(
        `${API_BASE_URL}posts/${postId}/report`,
        { reason, ...(description ? { description } : {}) },
        { headers }
      );
    } catch (error: any) {
      throw reportError(error, 'Failed to report post');
    }
  }

  async reportComment(commentId: string, reason: PostReportReason, description?: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.post(
        `${API_BASE_URL}comments/${commentId}/report`,
        { reason, ...(description ? { description } : {}) },
        { headers }
      );
    } catch (error: any) {
      throw reportError(error, 'Failed to report comment');
    }
  }
}

const ReportService = new ReportServiceClass();
export default ReportService;
