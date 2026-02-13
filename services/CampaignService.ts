import axios from 'axios';
import { API_BASE_URL } from '@/config/supabase';

/** API response shape from backend */
export interface CampaignRow {
  id: string;
  title: string;
  image: string | null;
  short_description: string | null;
  goal: number;
  raised: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/** Shape used by the campaign detail screen */
export interface Campaign {
  id: string;
  title: string;
  image: string;
  shortDescription: string;
  goalStats: {
    goal: number;
    actual: number;
    goalFormatted: string;
    actualFormatted: string;
  };
  status: string;
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

function mapRowToCampaign(row: CampaignRow): Campaign {
  const goal = Number(row.goal) || 0;
  const actual = Number(row.raised) || 0;
  return {
    id: row.id,
    title: row.title,
    image: row.image || '',
    shortDescription: row.short_description || '',
    goalStats: {
      goal,
      actual,
      goalFormatted: formatCurrency(goal, row.currency),
      actualFormatted: formatCurrency(actual, row.currency),
    },
    status: row.status || 'active',
  };
}

class CampaignServiceClass {
  /**
   * Get all campaigns
   */
  async getCampaigns(limit = 50, offset = 0, status?: string): Promise<Campaign[]> {
    try {
      const params: Record<string, string | number> = { limit, offset };
      if (status) params.status = status;
      const response = await axios.get<CampaignRow[]>(`${API_BASE_URL}campaigns`, { params });
      return (response.data || []).map(mapRowToCampaign);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get campaigns');
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(id: string): Promise<Campaign | null> {
    try {
      const response = await axios.get<CampaignRow>(`${API_BASE_URL}campaigns/${id}`);
      return mapRowToCampaign(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw new Error(error.response?.data?.error || 'Failed to get campaign');
    }
  }
}

const CampaignService = new CampaignServiceClass();
export default CampaignService;
