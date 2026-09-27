import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@/config/supabase';
import type { Post } from './FeedService';
import i18n from '@/i18n';

export interface CreatePostPayload {
  kind: 'text' | 'image' | 'video';
  title?: string;
  body?: string;
  country_code?: string;
  tagged_fan_club_id?: string;
  fan_club_id?: string;
  language?: string;
}

class PostServiceClass {
  private async getAuthHeader(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getPost(id: string): Promise<Post> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.get<Post>(`${API_BASE_URL}posts/${id}`, { headers });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to load post');
    }
  }

  async createPost(payload: CreatePostPayload): Promise<Post> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.post<Post>(`${API_BASE_URL}posts`, payload, { headers });
      return response.data;
    } catch (error: any) {
      // A restricted account is refused by the server; say so plainly rather
      // than surfacing the raw `account_restricted` code.
      if (error.response?.data?.error === 'account_restricted') {
        throw new Error(i18n.t('community.accountRestricted'));
      }
      throw new Error(error.response?.data?.error || 'Failed to create post');
    }
  }

  async updatePost(id: string, payload: Partial<CreatePostPayload>): Promise<Post> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.patch<Post>(`${API_BASE_URL}posts/${id}`, payload, { headers });
      return response.data;
    } catch (error: any) {
      // 409: the post was removed or rejected, and the backend no longer lets
      // its author edit it back into the feed.
      if (error.response?.data?.error === 'post_not_editable') {
        throw new Error(i18n.t('community.postNotEditable'));
      }
      throw new Error(error.response?.data?.error || 'Failed to update post');
    }
  }

  async deletePost(id: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.delete(`${API_BASE_URL}posts/${id}`, { headers });
    } catch (error: any) {
      // 409: a moderator deleting someone else's post from the app. Removing it
      // is a moderation act with an audit note, done from the dashboard.
      if (error.response?.data?.error === 'use_moderation_remove') {
        throw new Error(i18n.t('community.useModerationRemove'));
      }
      throw new Error(error.response?.data?.error || 'Failed to delete post');
    }
  }

  async likePost(id: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.post(`${API_BASE_URL}posts/${id}/like`, {}, { headers });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to like post');
    }
  }

  async unlikePost(id: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.delete(`${API_BASE_URL}posts/${id}/like`, { headers });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to unlike post');
    }
  }

  async sharePost(id: string, channel: string = 'native_share'): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.post(`${API_BASE_URL}posts/${id}/share`, { channel }, { headers });
    } catch {
      // Fire-and-forget
    }
  }
}

const PostService = new PostServiceClass();
export default PostService;
