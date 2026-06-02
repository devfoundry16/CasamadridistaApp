import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config/supabase';

export interface UserSearchResult {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export interface AdminAssignment {
  user_id: string;
  fan_club_id: string;
  role: string;
  created_at: string;
  user_profiles: { email: string; first_name: string | null; last_name: string | null };
  fan_clubs: { name: string; country: string };
}

export interface AdminFanClub {
  id: string;
  name: string;
  country: string;
  revenue_percentage: number;
  wallet_balance: number;
}

class SuperAdminServiceClass {
  private readonly AUTH_TOKEN_KEY = 'auth_token';

  private async getAuthHeader(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem(this.AUTH_TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async searchUsers(q: string): Promise<UserSearchResult[]> {
    const headers = await this.getAuthHeader();
    const res = await axios.get(`${API_BASE_URL}admin/users/search`, { headers, params: { q } });
    return res.data;
  }

  async listAdmins(): Promise<AdminAssignment[]> {
    const headers = await this.getAuthHeader();
    const res = await axios.get(`${API_BASE_URL}admin/admins`, { headers });
    return res.data;
  }

  async assignAdmin(userId: string, fanClubId: string): Promise<AdminAssignment> {
    const headers = await this.getAuthHeader();
    const res = await axios.post(`${API_BASE_URL}admin/admins`, { userId, fanClubId }, { headers });
    return res.data;
  }

  async removeAdmin(userId: string): Promise<void> {
    const headers = await this.getAuthHeader();
    await axios.delete(`${API_BASE_URL}admin/admins/${userId}`, { headers });
  }

  async listFanClubs(): Promise<AdminFanClub[]> {
    const headers = await this.getAuthHeader();
    const res = await axios.get(`${API_BASE_URL}admin/fan-clubs`, { headers });
    return res.data;
  }

  async updateFanClub(id: string, revenuePercentage: number): Promise<AdminFanClub> {
    const headers = await this.getAuthHeader();
    const res = await axios.put(`${API_BASE_URL}admin/fan-clubs/${id}`, { revenuePercentage }, { headers });
    return res.data;
  }
}

const SuperAdminService = new SuperAdminServiceClass();
export default SuperAdminService;
