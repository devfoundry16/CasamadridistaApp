import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { API_BASE_URL, supabase } from '@/config/supabase';

// Deeplink for password reset. Must match app.json "scheme" (casamadridistaapp).
// Add this exact URL (or casamadridistaapp://**) in Supabase Dashboard > Authentication > URL Configuration > Redirect URLs.
export const PASSWORD_RESET_REDIRECT_URL = 'casamadridistaapp://auth/reset-password';

// Deeplink for OAuth (e.g. Google). In Supabase Dashboard add exactly: casamadridistaapp://auth/callback (or casamadridistaapp://**).
export const OAUTH_CALLBACK_REDIRECT_URL = 'casamadridistaapp://auth/callback';

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
   * Start Google sign-in. Returns the OAuth URL to open in browser; after redirect, useAuthCallbackDeeplink will complete login.
   */
  async signInWithGoogle(): Promise<string> {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: OAUTH_CALLBACK_REDIRECT_URL,
        skipBrowserRedirect: true,
      },
    });
    if (error) throw new Error(error.message);
    if (!data?.url) throw new Error('No OAuth URL returned');
    return data.url;
  }

  /**
   * Check if Apple Sign In is available on this device (iOS 13+ only).
   */
  async isAppleSignInAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    return AppleAuthentication.isAvailableAsync();
  }

  /**
   * Sign in with Apple. Gets an identity token from Apple, exchanges it with Supabase via signInWithIdToken,
   * then fetches (and optionally updates) the user profile from the backend.
   * Apple only returns email/fullName on the very first sign-in — subsequent calls return null for those fields.
   */
  async signInWithApple(): Promise<User> {

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('Apple Sign In did not return an identity token');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) throw new Error(error.message);
    const session = data.session;
    if (!session) throw new Error('No session returned from Supabase');

    const authHeader = { Authorization: `Bearer ${session.access_token}` };

    // Fetch profile; backend auto-creates the profile row for new OAuth users.
    const profileResponse = await axios.get(`${API_BASE_URL}auth/profile`, { headers: authHeader });
    let profile = profileResponse.data as User['profile'];

    // Apple only provides name on the very first authentication — update it when available.
    const givenName = credential.fullName?.givenName;
    const familyName = credential.fullName?.familyName;
    if (givenName) {
      const updatedResponse = await axios.put(
        `${API_BASE_URL}auth/profile`,
        { firstName: givenName, lastName: familyName ?? '' },
        { headers: authHeader }
      );
      profile = updatedResponse.data as User['profile'];
    }

    const user: User = {
      id: session.user.id,
      email: session.user.email ?? credential.email ?? '',
      profile,
    };

    await this.storeAuthData(session.access_token, session.refresh_token, user);
    return user;
  }

  /**
   * Store OAuth session after callback (used by useAuthCallbackDeeplink). Public so the hook can persist tokens and user.
   */
  async storeOAuthSession(accessToken: string, refreshToken: string, user: User): Promise<void> {
    await this.storeAuthData(accessToken, refreshToken, user);
  }

  /**
   * Send password reset email via Supabase (opens app via deeplink when user taps link)
   */
  async forgotPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: PASSWORD_RESET_REDIRECT_URL,
    });
    if (error) {
      throw new Error(error.message);
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
    } catch {
      return false;
    }
  }
}

const AuthService = new AuthServiceClass();
export default AuthService;
