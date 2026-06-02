import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config/supabase';

export interface DashboardOverview {
  club: {
    id: string;
    name: string;
    country: string;
    revenue_percentage: number;
    wallet_balance: number;
  };
  activeMembers: number;
  monthlyRevenue: number;
  walletBalance: number;
}

export interface DashboardMember {
  id: string;
  status: string;
  subscription_type: string;
  created_at: string;
  user_profiles: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export interface RevenueTransaction {
  id: string;
  type: 'revenue_share' | 'payout';
  amount: number;
  description: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

class FanClubDashboardServiceClass {
  private readonly AUTH_TOKEN_KEY = 'auth_token';

  private async getAuthHeader(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem(this.AUTH_TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getOverview(): Promise<DashboardOverview> {
    const headers = await this.getAuthHeader();
    const res = await axios.get(`${API_BASE_URL}fan-club-dashboard/overview`, { headers });
    return res.data;
  }

  async getMembers(page = 1): Promise<PaginatedResponse<DashboardMember>> {
    const headers = await this.getAuthHeader();
    const res = await axios.get(`${API_BASE_URL}fan-club-dashboard/members`, { headers, params: { page } });
    return res.data;
  }

  async getRevenue(page = 1): Promise<PaginatedResponse<RevenueTransaction>> {
    const headers = await this.getAuthHeader();
    const res = await axios.get(`${API_BASE_URL}fan-club-dashboard/revenue`, { headers, params: { page } });
    return res.data;
  }

  async requestPayout(amount: number): Promise<{ transaction: RevenueTransaction; newBalance: number }> {
    const headers = await this.getAuthHeader();
    const res = await axios.post(`${API_BASE_URL}fan-club-dashboard/payout`, { amount }, { headers });
    return res.data;
  }
}

const FanClubDashboardService = new FanClubDashboardServiceClass();
export default FanClubDashboardService;
