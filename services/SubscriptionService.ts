import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config/supabase';

export interface Subscription {
  id: string;
  user_id: string;
  subscription_type: string;
  status: 'active' | 'cancelled' | 'expired';
  start_date: string;
  end_date?: string;
  price: number;
  currency: string;
  receipt_data?: any;
  created_at: string;
  updated_at: string;
}

class SubscriptionServiceClass {
  private readonly AUTH_TOKEN_KEY = 'auth_token';

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
   * Get all user subscriptions
   */
  async getSubscriptions(): Promise<Subscription[]> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.get(`${API_BASE_URL}subscriptions`, { headers });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get subscriptions');
    }
  }

  /**
   * Get active subscription
   */
  async getActiveSubscription(): Promise<Subscription | null> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.get(`${API_BASE_URL}subscriptions/active`, { headers });
      return response.data;
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscriptionById(id: string): Promise<Subscription> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.get(`${API_BASE_URL}subscriptions/${id}`, { headers });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get subscription');
    }
  }

  /**
   * Create subscription (after in-app purchase)
   */
  async createSubscription(data: {
    subscriptionType: string;
    price: number;
    currency?: string;
    endDate?: string;
    receiptData?: any;
  }): Promise<Subscription> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.post(`${API_BASE_URL}subscriptions`, data, { headers });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create subscription');
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    id: string,
    data: {
      status?: 'active' | 'cancelled' | 'expired';
      endDate?: string;
      receiptData?: any;
    }
  ): Promise<Subscription> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.put(`${API_BASE_URL}subscriptions/${id}`, data, { headers });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update subscription');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(id: string): Promise<Subscription> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.post(`${API_BASE_URL}subscriptions/${id}/cancel`, {}, { headers });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to cancel subscription');
    }
  }

  /**
   * Delete subscription
   */
  async deleteSubscription(id: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.delete(`${API_BASE_URL}subscriptions/${id}`, { headers });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete subscription');
    }
  }
}

const SubscriptionService = new SubscriptionServiceClass();
export default SubscriptionService;
