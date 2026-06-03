import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@/config/supabase';

export type FeedTab = 'for-you' | 'trending' | 'recent' | 'fan-clubs';

export interface PostAuthor {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string;
  country_code: string | null;
}

export interface PostFanClub {
  id: string;
  name: string;
  logo_url: string | null;
  is_verified: boolean;
}

export interface PostMedia {
  id: string;
  post_id: string;
  kind: 'image' | 'video';
  storage_provider: string;
  storage_key: string | null;
  hls_url: string | null;
  thumbnail_url: string | null;
  blurhash: string | null;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
  size_bytes: number | null;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
}

export interface Post {
  id: string;
  author_id: string;
  author_type: 'user' | 'fan_club';
  fan_club_id: string | null;
  kind: 'text' | 'image' | 'video';
  title: string | null;
  body: string | null;
  language: string;
  country_code: string | null;
  tagged_fan_club_id: string | null;
  status: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
  hot_score: number;
  is_pinned: boolean;
  is_sponsored: boolean;
  created_at: string;
  updated_at: string;
  // joined
  author: PostAuthor | null;
  fan_club: PostFanClub | null;
  tagged_fan_club: PostFanClub | null;
  media: PostMedia[];
  liked_by_me: boolean;
}

export interface FeedPage {
  posts: Post[];
  nextCursor: string | null;
}

class FeedServiceClass {
  private async getAuthHeader(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getFeed(tab: FeedTab = 'for-you', cursor?: string | null): Promise<FeedPage> {
    try {
      const headers = await this.getAuthHeader();
      const params: Record<string, string> = { tab };
      if (cursor) params.cursor = cursor;

      const response = await axios.get<FeedPage>(`${API_BASE_URL}feed`, { headers, params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to load feed');
    }
  }

  async recordViews(postIds: string[]): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.post(`${API_BASE_URL}posts/views`, { post_ids: postIds }, { headers });
    } catch {
      // Fire-and-forget: silently fail
    }
  }
}

const FeedService = new FeedServiceClass();
export default FeedService;
