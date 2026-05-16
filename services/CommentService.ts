import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@/config/supabase';

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  status: string;
  like_count: number;
  created_at: string;
  author: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface CommentsPage {
  comments: Comment[];
  nextCursor: string | null;
}

class CommentServiceClass {
  private async getAuthHeader(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getComments(postId: string, cursor?: string | null): Promise<CommentsPage> {
    try {
      const headers = await this.getAuthHeader();
      const params: Record<string, string> = {};
      if (cursor) params.cursor = cursor;
      const response = await axios.get<CommentsPage>(
        `${API_BASE_URL}posts/${postId}/comments`,
        { headers, params }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to load comments');
    }
  }

  async createComment(postId: string, body: string, parentId?: string): Promise<Comment> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.post<Comment>(
        `${API_BASE_URL}comments`,
        { post_id: postId, body, parent_id: parentId },
        { headers }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create comment');
    }
  }

  async deleteComment(id: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.delete(`${API_BASE_URL}comments/${id}`, { headers });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete comment');
    }
  }

  async likeComment(id: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.post(`${API_BASE_URL}comments/${id}/like`, {}, { headers });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to like comment');
    }
  }

  async unlikeComment(id: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.delete(`${API_BASE_URL}comments/${id}/like`, { headers });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to unlike comment');
    }
  }
}

const CommentService = new CommentServiceClass();
export default CommentService;
