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
    /** Sent to the club's owners and admins only. */
    email?: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export interface RevenueTransaction {
  id: string;
  /** 'payout_reversal': a rejected or cancelled payout credited back. */
  type: 'revenue_share' | 'payout' | 'payout_reversal';
  amount: number;
  description: string | null;
  created_at: string;
}

/** One club the signed-in user administers, as `GET /auth/roles` lists it. */
export interface AdministeredClub {
  id: string;
  name: string | null;
  role: 'owner' | 'admin' | 'editor';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

class FanClubDashboardServiceClass {
  private readonly AUTH_TOKEN_KEY = 'auth_token';

  /**
   * The club the dashboard screens are looking at. The backend needs its id
   * whenever the user administers more than one club (it answers 400
   * otherwise), so every call sends it once a club is chosen.
   */
  private selected: AdministeredClub | null = null;

  private async getAuthHeader(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem(this.AUTH_TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * The club id to send, resolving one lazily when nothing is selected yet.
   *
   * The overview screen normally selects a club first, but a cold deep link
   * straight to members or revenue skips it — and for someone who runs two
   * clubs the backend then answers 400. So pick the first club here, exactly as
   * the overview screen would. If the roles call fails, send nothing: a
   * single-club admin still works, because the backend infers the club.
   */
  private async clubParam(): Promise<{ fanClubId?: string }> {
    if (!this.selected) {
      try {
        const clubs = await this.getClubs();
        // A choice made while this request was in flight wins over the default.
        if (!this.selected) this.selected = clubs[0] ?? null;
      } catch {
        // Fall through without a club; see above.
      }
    }
    return this.selected ? { fanClubId: this.selected.id } : {};
  }

  /** Every club the user administers, with their role in each. */
  async getClubs(): Promise<AdministeredClub[]> {
    const headers = await this.getAuthHeader();
    const res = await axios.get(`${API_BASE_URL}auth/roles`, { headers });
    return Array.isArray(res.data?.fanClubs) ? res.data.fanClubs : [];
  }

  /** Pass null on sign-out, so the next account never inherits this choice. */
  selectClub(club: AdministeredClub | null) {
    this.selected = club;
  }

  get selectedClub(): AdministeredClub | null {
    return this.selected;
  }

  /** Payouts move club money, so the backend allows them to owners and admins only. */
  get canRequestPayout(): boolean {
    return this.selected ? this.selected.role !== 'editor' : true;
  }

  async getOverview(): Promise<DashboardOverview> {
    const headers = await this.getAuthHeader();
    const res = await axios.get(`${API_BASE_URL}fan-club-dashboard/overview`, {
      headers,
      params: await this.clubParam(),
    });
    return res.data;
  }

  async getMembers(page = 1): Promise<PaginatedResponse<DashboardMember>> {
    const headers = await this.getAuthHeader();
    const res = await axios.get(`${API_BASE_URL}fan-club-dashboard/members`, {
      headers,
      params: { page, ...(await this.clubParam()) },
    });
    return res.data;
  }

  async getRevenue(page = 1): Promise<PaginatedResponse<RevenueTransaction>> {
    const headers = await this.getAuthHeader();
    const res = await axios.get(`${API_BASE_URL}fan-club-dashboard/revenue`, {
      headers,
      params: { page, ...(await this.clubParam()) },
    });
    return res.data;
  }

  async requestPayout(amount: number): Promise<{
    payout: { id: string; amount: number; status: string };
    transaction: Pick<RevenueTransaction, 'id' | 'type' | 'amount'>;
    newBalance: number;
  }> {
    const headers = await this.getAuthHeader();
    const res = await axios.post(
      `${API_BASE_URL}fan-club-dashboard/payout`,
      { amount, ...(await this.clubParam()) },
      { headers },
    );
    return res.data;
  }
}

const FanClubDashboardService = new FanClubDashboardServiceClass();
export default FanClubDashboardService;
