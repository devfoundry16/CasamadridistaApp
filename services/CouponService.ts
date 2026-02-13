import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config/supabase';

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_amount?: number;
  max_discount?: number;
  usage_limit?: number;
  usage_count: number;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponValidation {
  valid: boolean;
  coupon: Coupon;
  discount_amount: number;
  final_amount: number;
}

class CouponServiceClass {
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
   * Get all active coupons
   */
  async getCoupons(): Promise<Coupon[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}coupons`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get coupons');
    }
  }

  /**
   * Get coupon by code
   */
  async getCouponByCode(code: string): Promise<Coupon> {
    try {
      const response = await axios.get(`${API_BASE_URL}coupons/code/${code}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Invalid coupon code');
    }
  }

  /**
   * Validate coupon and calculate discount
   */
  async validateCoupon(code: string, orderAmount: number): Promise<CouponValidation> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.post(
        `${API_BASE_URL}coupons/validate`,
        { code, orderAmount },
        { headers }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to validate coupon');
    }
  }

  /**
   * Apply coupon (mark as used)
   */
  async applyCoupon(code: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.post(`${API_BASE_URL}coupons/apply`, { code }, { headers });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to apply coupon');
    }
  }

  /**
   * Create coupon (admin)
   */
  async createCoupon(data: {
    code: string;
    description?: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minAmount?: number;
    maxDiscount?: number;
    usageLimit?: number;
    expiresAt?: string;
  }): Promise<Coupon> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.post(`${API_BASE_URL}coupons/admin`, data, { headers });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create coupon');
    }
  }

  /**
   * Update coupon (admin)
   */
  async updateCoupon(
    id: string,
    data: Partial<{
      description: string;
      discountType: 'percentage' | 'fixed';
      discountValue: number;
      minAmount: number;
      maxDiscount: number;
      usageLimit: number;
      expiresAt: string;
      isActive: boolean;
    }>
  ): Promise<Coupon> {
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.put(`${API_BASE_URL}coupons/admin/${id}`, data, { headers });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update coupon');
    }
  }

  /**
   * Delete coupon (admin)
   */
  async deleteCoupon(id: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.delete(`${API_BASE_URL}coupons/admin/${id}`, { headers });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete coupon');
    }
  }
}

const CouponService = new CouponServiceClass();
export default CouponService;
