import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@/config/supabase';

export interface User {
  id: string;
  email: string;
  profile: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    avatar_url?: string;
    stripe_customer_id?: string;
    created_at: string;
    updated_at: string;
  };
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

class AuthServiceClass {
  private readonly AUTH_TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user_data';

  /**
   * Get authorization header
   */
  private async getAuthHeader(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem(this.AUTH_TOKEN_KEY);
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }

  /**
   * Store authentication data
   */
  private async storeAuthData(accessToken: string, refreshToken: string, user: User): Promise<void> {
    await AsyncStorage.multiSet([
      [this.AUTH_TOKEN_KEY, accessToken],
      [this.REFRESH_TOKEN_KEY, refreshToken],
      [this.USER_KEY, JSON.stringify(user)],
    ]);
  }

  /**
   * Register a new user
   */
  async register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    phone?: string
  ): Promise<User> {
    try {
      const response = await axios.post(`${API_BASE_URL}auth/register`, {
        email,
        password,
        firstName,
        lastName,
        phone,
      });
      return response.data.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<User> {
    try {
      const response = await axios.post<LoginResponse>(`${API_BASE_URL}auth/login`, {
        email,
        password,
      });

      const { access_token, refresh_token, user } = response.data;
      await this.storeAuthData(access_token, refresh_token, user);

      return user;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([
      this.AUTH_TOKEN_KEY,
      this.REFRESH_TOKEN_KEY,
      this.USER_KEY,
    ]);
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem(this.AUTH_TOKEN_KEY);
    return !!token;
  }

  /**
   * Get current user from storage
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(this.USER_KEY);
      if (!userData) return null;
      return JSON.parse(userData);
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Get user profile from server
   */
  async getProfile(): Promise<User['profile']> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.get(`${API_BASE_URL}auth/profile`, { headers });
      
      // Update stored user data
      const currentUser = await this.getCurrentUser();
      if (currentUser) {
        currentUser.profile = response.data;
        await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(currentUser));
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get profile');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
  }): Promise<User['profile']> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.put(`${API_BASE_URL}auth/profile`, data, { headers });

      // Update stored user data
      const currentUser = await this.getCurrentUser();
      if (currentUser) {
        currentUser.profile = response.data;
        await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(currentUser));
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update profile');
    }
  }

  /**
   * Upload avatar via backend (uses service-role storage access)
   */
  async uploadAvatar(imageBase64: string, filename: string): Promise<User['profile']> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.post(
        `${API_BASE_URL}auth/avatar`,
        { imageBase64, filename },
        { headers }
      );

      const profile = response.data.profile as User['profile'];

      // Update stored user data
      const currentUser = await this.getCurrentUser();
      if (currentUser) {
        currentUser.profile = profile;
        await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(currentUser));
      }

      return profile;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to upload avatar');
    }
  }

  /**
   * Change password
   */
  async changePassword(newPassword: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.post(`${API_BASE_URL}auth/change-password`, { newPassword }, { headers });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to change password');
    }
  }

  /**
   * Delete account
   */
  async deleteAccount(): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.delete(`${API_BASE_URL}auth/account`, { headers });
      await this.logout();
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete account');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = await AsyncStorage.getItem(this.REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${API_BASE_URL}auth/refresh`, {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token: new_refresh_token } = response.data;
      await AsyncStorage.multiSet([
        [this.AUTH_TOKEN_KEY, access_token],
        [this.REFRESH_TOKEN_KEY, new_refresh_token],
      ]);

      return access_token;
    } catch (error: any) {
      await this.logout();
      throw new Error(error.response?.data?.error || 'Failed to refresh token');
    }
  }

  /**
   * Get auth token
   */
  async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem(this.AUTH_TOKEN_KEY);
  }

  /**
   * Validate credentials (for account operations)
   */
  async validateCredentials(email: string, password: string): Promise<boolean> {
    try {
      await this.login(email, password);
      return true;
    } catch (error) {
      return false;
    }
  }
}

const AuthService = new AuthServiceClass();
export default AuthService;
