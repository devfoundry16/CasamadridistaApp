import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@/config/supabase';
import type { Post } from './FeedService';
import i18n from '@/i18n';
import { normaliseGridPage } from '@/services/social/normalise';
import type { ProfileGridPage } from '@/types/social';

export interface CreatePostPayload {
  kind: 'text' | 'image' | 'video';
  title?: string;
  body?: string;
  country_code?: string;
  tagged_fan_club_id?: string;
  fan_club_id?: string;
  language?: string;
  /** Free text, at most 80 characters (`utils/post.core` normalises it). */
  location_name?: string;
  /** People tagged in the post, at most 20 (`mentions.core` TAG_MAX). */
  tagged_user_ids?: string[];
}

export interface SaveState {
  saved: boolean;
  save_count: number;
}

class PostServiceClass {
  private async getAuthHeader(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getPost(id: string): Promise<Post> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.get<Post>(`${API_BASE_URL}posts/${encodeURIComponent(id)}`, { headers });
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
      const response = await axios.patch<Post>(`${API_BASE_URL}posts/${encodeURIComponent(id)}`, payload, { headers });
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
      await axios.delete(`${API_BASE_URL}posts/${encodeURIComponent(id)}`, { headers });
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
      await axios.post(`${API_BASE_URL}posts/${encodeURIComponent(id)}/like`, {}, { headers });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to like post');
    }
  }

  async unlikePost(id: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.delete(`${API_BASE_URL}posts/${encodeURIComponent(id)}/like`, { headers });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to unlike post');
    }
  }

  async savePost(id: string): Promise<SaveState> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.post<SaveState>(`${API_BASE_URL}posts/${encodeURIComponent(id)}/save`, {}, { headers });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to save post');
    }
  }

  async unsavePost(id: string): Promise<SaveState> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.delete<SaveState>(`${API_BASE_URL}posts/${encodeURIComponent(id)}/save`, { headers });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to unsave post');
    }
  }

  /** Your saved posts, newest save first, as grid cells for the profile's Saved tab. */
  async savedGrid(cursor?: string | null): Promise<ProfileGridPage> {
    try {
      const headers = await this.getAuthHeader();
      const params: Record<string, string> = { layout: 'grid' };
      if (cursor) params.cursor = cursor;
      const response = await axios.get(`${API_BASE_URL}posts/saved`, { headers, params });
      return normaliseGridPage(response.data);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to load saved posts');
    }
  }

  async sharePost(id: string, channel: string = 'native_share'): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.post(`${API_BASE_URL}posts/${encodeURIComponent(id)}/share`, { channel }, { headers });
    } catch {
      // Fire-and-forget
    }
  }
}

const PostService = new PostServiceClass();
export default PostService;
