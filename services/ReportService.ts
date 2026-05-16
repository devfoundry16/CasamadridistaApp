import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@/config/supabase';

export type ReportReason = 'spam' | 'nudity' | 'violence' | 'hate' | 'misinformation' | 'other';

class ReportServiceClass {
  private async getAuthHeader(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async reportPost(postId: string, reason: ReportReason, description?: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.post(
        `${API_BASE_URL}posts/${postId}/report`,
        { reason, description },
        { headers }
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to report post');
    }
  }

  async reportComment(commentId: string, reason: ReportReason, description?: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.post(
        `${API_BASE_URL}comments/${commentId}/report`,
        { reason, description },
        { headers }
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to report comment');
    }
  }
}

const ReportService = new ReportServiceClass();
export default ReportService;
