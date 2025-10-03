import AsyncStorage from '@react-native-async-storage/async-storage';
const DEFAULT_BASE_URL = 'https://casamadridista.com';
const API_BASE_URL_KEY = 'api_base_url_key';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  avatar_urls: Record<string, string>;
}

export interface AuthResponse {
  token: string;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
}
class AuthApiService {
  private baseUrl: string = DEFAULT_BASE_URL;

  async initialize() {
    const savedUrl = await AsyncStorage.getItem(API_BASE_URL_KEY);
    if (savedUrl) {
      this.baseUrl = savedUrl;
    }
    console.log('Initialized with base URL:', this.baseUrl);
  }

  async setBaseUrl(url: string) {
    this.baseUrl = url;
    await AsyncStorage.setItem(API_BASE_URL_KEY, url);
    console.log('[WordPress] Base URL updated to:', url);
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = await AsyncStorage.getItem('jwt_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseUrl}/wp-json${endpoint}`;
    console.log('[WordPress] Fetching:', url);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[WordPress] Error:', response.status, errorText);
      throw new Error(`WordPress API Error: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/wp-json/profile/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    await AsyncStorage.setItem('jwt_token', data.token);
    await AsyncStorage.setItem('user_data', JSON.stringify(data));
    console.log('[WordPress] Login successful:', data.user_display_name);
    return data;
  }

  async register(username: string, email: string, password: string): Promise<any> {
    return this.fetchWithAuth('/wp/v2/users/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  async validateToken(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (!token) return false;

      const response = await fetch(`${this.baseUrl}/wp-json/jwt-auth/v1/token/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('[WordPress] Token validation failed:', error);
      return false;
    }
  }

  async logout() {
    await AsyncStorage.removeItem('jwt_token');
    await AsyncStorage.removeItem('user_data');
    console.log('[WordPress] Logged out');
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (!userData) return null;
      return JSON.parse(userData);
    } catch (error) {
      console.error('[WordPress] Failed to get current user:', error);
      return null;
    }
  }
}

export const UserService = new AuthApiService();