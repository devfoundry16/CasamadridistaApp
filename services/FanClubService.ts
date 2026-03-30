import axios from 'axios';
import { API_BASE_URL } from '@/config/supabase';

export interface FanClub {
  id: string;
  name: string;
  country: string;
  country_code: string | null;
  founding_year: string | null;
  address: string | null;
  president: string | null;
  secretary: string | null;
  contact: string | null;
  logo_url: string | null;
  created_at: string;
}

export interface FanClubCountry {
  country: string;
  country_code: string | null;
}

class FanClubServiceClass {
  /**
   * Get distinct countries that have at least one fan club
   */
  async getCountries(): Promise<FanClubCountry[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}fan-clubs/countries`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to load countries');
    }
  }

  /**
   * Get all fan clubs for a specific country
   */
  async getClubsByCountry(country: string): Promise<FanClub[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}fan-clubs`, {
        params: { country },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to load fan clubs');
    }
  }

  /**
   * Get a single fan club by ID
   */
  async getClubById(id: string): Promise<FanClub> {
    try {
      const response = await axios.get(`${API_BASE_URL}fan-clubs/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to load fan club');
    }
  }
}

const FanClubService = new FanClubServiceClass();
export default FanClubService;
