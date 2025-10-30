import { Order } from "@/types/shop/order";
import axios, { AxiosInstance } from "axios";

class ApiService {
  private api: AxiosInstance;
  private token = "";
  private WOO_USERNAME = "ck_5761f8ce313356e07555cf14a8c2099ab27d7942";
  private WOO_PASSWORD = "cs_72d03b9110f7f1e3592f5c4a77cbd7c42b176075";
  constructor() {
    this.token = btoa(`${this.WOO_USERNAME}:${this.WOO_PASSWORD}`);
    this.api = axios.create({
      baseURL:
        process.env.EXPO_PUBLIC_API_URL ||
        "https://casamadridista.com/wp-json/wc/v3",
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

  async createOrder(params: Partial<Order>) {
    try {
      const response = await this.api.post("/orders", params);
      return response.data;
    } catch (error: any) {}
  }

  async createSubscriptionOrder(order_id: number) {
    try {
      const response = await this.api.post(`/orders/${order_id}/subscriptions`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "An error occurred");
    }
  }

  async getSubscriptionOrders(customer_id: number) {
    try {
      const response = await this.api.get(
        `/subscriptions?customer=${customer_id}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "An error occurred");
    }
  }

  async getOrders(customerId: number) {
    try {
      const response = await this.api.get("/orders", {
        params: { customer: customerId },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "An error occurred");
    }
  }

  async updateOrder(orderId: number, data: Partial<Order>) {
    try {
      const response = await this.api.put(`/orders/${orderId}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "An error occurred");
    }
  }
}

export const OrderService = new ApiService();
