import { Order } from "@/types/shop/order";
import axios, { AxiosInstance } from "axios";
import { WOO_CONSUMER_KEY, WOO_CONSUMER_SECRET, WP_BASE_URL } from "@env";
class ApiService {
  private api: AxiosInstance;
  private token = "";
  private WOO_USERNAME = WOO_CONSUMER_KEY;
  private WOO_PASSWORD = WOO_CONSUMER_SECRET;
  constructor() {
    this.token = btoa(`${this.WOO_USERNAME}:${this.WOO_PASSWORD}`);
    console.log(this.WOO_PASSWORD);
    this.api = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_URL || `${WP_BASE_URL}wc/v3`,
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
      console.log("customer Id:", customerId);
      const response = await this.api.get(`/orders?customer=${customerId}`);
      console.log(response);
      return response.data;
    } catch (error: any) {
      throw new Error(error || "An error occurred");
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

  // Update a subscription (e.g., schedule changes or modify status)
  async updateSubscription(subscriptionId: number, data: any) {
    try {
      const response = await this.api.put(
        `/subscriptions/${subscriptionId}`,
        data
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "An error occurred");
    }
  }
}

export const OrderService = new ApiService();
