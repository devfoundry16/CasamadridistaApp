import { Coupon } from "@/types/shop/coupon";
import axios, { AxiosInstance } from "axios";
import { WOO_CONSUMER_KEY, WOO_CONSUMER_SECRET, WP_BASE_URL } from "@env";
class ApiService {
  private api: AxiosInstance;
  private token = "";
  private WOO_USERNAME = WOO_CONSUMER_KEY;
  private WOO_PASSWORD = WOO_CONSUMER_SECRET;
  constructor() {
    this.token = btoa(`${this.WOO_USERNAME}:${this.WOO_PASSWORD}`);
    this.api = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_URL || `${WP_BASE_URL}/wc/v3`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${this.token}`,
      },
    });

    // Add response interceptor for consistent error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        throw new Error(error.response?.data?.message || "An error occurred");
      }
    );
  }

  async createCoupon(params: Partial<Coupon>) {
    try {
      const response = await this.api.post("/coupons", params);
      return response.data;
    } catch (error: any) {}
  }

  async getCoupons() {
    try {
      const response = await this.api.get("/coupons", {});
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "An error occurred");
    }
  }

  async updateCoupon(couponId: number, data: Partial<Coupon>) {
    try {
      const response = await this.api.put(`/coupons/${couponId}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "An error occurred");
    }
  }
}

export const CouponService = new ApiService();
