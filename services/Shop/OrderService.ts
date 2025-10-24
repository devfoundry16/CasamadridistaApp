import { CreateOrderParams } from "@/types/user/order";
import axios, { AxiosInstance } from "axios";
import AuthService from "../AuthService";

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

  async createOrder(params: Partial<CreateOrderParams>[]) {
    try {
      const userString = await AuthService.getUserData();
      const user = userString?.length && JSON.parse(userString);
      const response = await this.api.post("/orders", {
        payment_method: "stripe", // or 'paypal', etc.
        payment_method_title: "Link",
        set_paid: false, // Let the payment gateway handle the payment
        customer_id: user.id,
        billing: user?.billing,
        shipping: user?.shipping,
        line_items: params.map((param) => {
          return {
            product_id: param.productId, // The ID of your subscription product
            quantity: param.quantity,
          };
        }),
      });
      return response.data;
    } catch (error: any) {}
  }

  async updateOrder(orderId: number, data: Partial<CreateOrderParams>) {
    try {
      const response = await this.api.put(`/orders/${orderId}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "An error occurred");
    }
  }
}

export const OrderService = new ApiService();
