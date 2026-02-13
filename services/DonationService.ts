import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config/supabase';

export interface Donation {
  id: string;
  user_id?: string;
  donor_name: string;
  donor_email?: string;
  amount: number;
  currency: string;
  campaign_name?: string;
  message?: string;
  payment_method: string;
  stripe_payment_intent_id?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface DonationStats {
  total_amount: number;
  total_count: number;
  completed_count: number;
  currency: string;
}

class DonationServiceClass {
  private readonly AUTH_TOKEN_KEY = 'auth_token';

  /**
   * Get authorization header (optional for donations)
   */
  private async getAuthHeader(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem(this.AUTH_TOKEN_KEY);
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }

  /**
   * Get all donations (user's own or all if not authenticated)
   */
  async getDonations(
    limit: number = 50,
    offset: number = 0,
    campaignName?: string
  ): Promise<Donation[]> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.get(`${API_BASE_URL}donations`, {
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        params: { limit, offset, campaignName },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get donations');
    }
  }

  /**
   * Get donation by ID
   */
  async getDonationById(id: string): Promise<Donation> {
    try {
      const response = await axios.get(`${API_BASE_URL}donations/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get donation');
    }
  }

  /**
   * Create Stripe payment intent for donation
   */
  async createDonationIntent(data: {
    amount: number;
    currency?: string;
    campaignName?: string;
    donorName?: string;
    donorEmail?: string;
    message?: string;
  }): Promise<{
    clientSecret: string;
    paymentIntentId: string;
  }> {
    try {
      const response = await axios.post(`${API_BASE_URL}donations/intent`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create donation intent');
    }
  }

  /**
   * Confirm donation after Stripe payment
   */
  async confirmDonation(data: {
    paymentIntentId: string;
    amount: number;
    campaignName?: string;
    donorName?: string;
    donorEmail?: string;
    message?: string;
  }): Promise<{
    message: string;
    donation: Donation;
  }> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.post(`${API_BASE_URL}donations/confirm`, data, {
        headers: Object.keys(headers).length > 0 ? headers : undefined,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to confirm donation');
    }
  }

  /**
   * Get donation statistics
   */
  async getDonationStats(campaignName?: string): Promise<DonationStats> {
    try {
      const response = await axios.get(`${API_BASE_URL}donations/stats`, {
        params: { campaignName },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get donation stats');
    }
  }
}

const DonationService = new DonationServiceClass();
export default DonationService;
