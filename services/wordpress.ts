import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_BASE_URL = 'https://casamadridista.com';
const API_BASE_URL_KEY = 'wordpress_api_base_url';

export interface WordPressPost {
  id: number;
  date: string;
  modified: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  author: number;
  featured_media: number;
  categories: number[];
  tags: number[];
  _embedded?: {
    'wp:featuredmedia'?: {
      source_url: string;
      alt_text: string;
    }[];
    author?: {
      id: number;
      name: string;
      avatar_urls: Record<string, string>;
    }[];
  };
}

export interface WordPressCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  parent: number;
}

export interface WordPressPage {
  id: number;
  date: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  parent: number;
  featured_media: number;
}

export interface WordPressComment {
  id: number;
  post: number;
  parent: number;
  author: number;
  author_name: string;
  author_avatar_urls: Record<string, string>;
  date: string;
  content: {
    rendered: string;
  };
}

export interface WordPressUser {
  id: number;
  username: string;
  name: string;
  email: string;
  avatar_urls: Record<string, string>;
}

export interface Campaign {
  id: number;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  acf?: {
    campaign_image?: string;
    campaign_avatar?: string;
    amount_raised?: number;
    goal_amount?: number;
    currency?: string;
    campaign_status?: string;
  };
  slug: string;
  date: string;
  modified: string;
}

export interface Donor {
  id: number;
  title: {
    rendered: string;
  };
  acf?: {
    donor_name?: string;
    donor_avatar?: string;
    donation_amount?: number;
    currency?: string;
    campaign_id?: number;
  };
  date: string;
}

export interface AuthResponse {
  token: string;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
}

class WordPressService {
  private baseUrl: string = DEFAULT_BASE_URL;

  async initialize() {
    const savedUrl = await AsyncStorage.getItem(API_BASE_URL_KEY);
    if (savedUrl) {
      this.baseUrl = savedUrl;
    }
    console.log('[WordPress] Initialized with base URL:', this.baseUrl);
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

  async getPosts(params: {
    page?: number;
    per_page?: number;
    categories?: number[];
    search?: string;
  } = {}): Promise<WordPressPost[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('_embed', '1');
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.categories?.length) queryParams.append('categories', params.categories.join(','));
    if (params.search) queryParams.append('search', params.search);

    return this.fetchWithAuth(`/wp/v2/posts?${queryParams.toString()}`);
  }

  async getPost(id: number): Promise<WordPressPost> {
    return this.fetchWithAuth(`/wp/v2/posts/${id}?_embed=1`);
  }

  async getCategories(): Promise<WordPressCategory[]> {
    return this.fetchWithAuth('/wp/v2/categories?per_page=100');
  }

  async getPages(): Promise<WordPressPage[]> {
    return this.fetchWithAuth('/wp/v2/pages?per_page=100');
  }

  async getPage(slug: string): Promise<WordPressPage> {
    const pages = await this.fetchWithAuth(`/wp/v2/pages?slug=${slug}`);
    if (!pages || pages.length === 0) {
      throw new Error(`Page not found: ${slug}`);
    }
    return pages[0];
  }

  async getComments(postId: number): Promise<WordPressComment[]> {
    return this.fetchWithAuth(`/wp/v2/comments?post=${postId}&per_page=100`);
  }

  async createComment(postId: number, content: string, parent: number = 0): Promise<WordPressComment> {
    return this.fetchWithAuth('/wp/v2/comments', {
      method: 'POST',
      body: JSON.stringify({
        post: postId,
        content,
        parent,
      }),
    });
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/wp-json/jwt-auth/v1/token`, {
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

  async register(data: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    role?: string;
  }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: data.username,
        email: data.email,
        password: data.password,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        roles: data.role ? [data.role] : ['subscriber'],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const result = await response.json();
    console.log('[WordPress] Registration successful:', result.username);
    return result;
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

  async getCurrentUser(): Promise<WordPressUser | null> {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (!userData) return null;
      return JSON.parse(userData);
    } catch (error) {
      console.error('[WordPress] Failed to get current user:', error);
      return null;
    }
  }

  async getCampaigns(params: {
    page?: number;
    per_page?: number;
    status?: string;
  } = {}): Promise<Campaign[]> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params.status) queryParams.append('status', params.status);

    return this.fetchWithAuth(`/wp/v2/campaigns?${queryParams.toString()}`);
  }

  async getCampaign(id: number): Promise<Campaign> {
    return this.fetchWithAuth(`/wp/v2/campaigns/${id}`);
  }

  async getCampaignBySlug(slug: string): Promise<Campaign> {
    const campaigns = await this.fetchWithAuth(`/wp/v2/campaigns?slug=${slug}`);
    if (!campaigns || campaigns.length === 0) {
      throw new Error(`Campaign not found: ${slug}`);
    }
    return campaigns[0];
  }

  async getDonors(campaignId?: number): Promise<Donor[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('per_page', '100');
    
    if (campaignId) {
      queryParams.append('campaign_id', campaignId.toString());
    }

    return this.fetchWithAuth(`/wp/v2/donors?${queryParams.toString()}`);
  }

  async createDonation(data: {
    campaignId: number;
    amount: number;
    currency: string;
    donorName?: string;
    donorEmail?: string;
    message?: string;
  }): Promise<any> {
    return this.fetchWithAuth('/wp/v2/donations', {
      method: 'POST',
      body: JSON.stringify({
        campaign_id: data.campaignId,
        amount: data.amount,
        currency: data.currency,
        donor_name: data.donorName,
        donor_email: data.donorEmail,
        message: data.message,
      }),
    });
  }
}

export const wordpressService = new WordPressService();
