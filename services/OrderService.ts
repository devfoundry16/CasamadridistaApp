import { OrderStatus } from '@/types/user/order';
import axios, { AxiosInstance } from 'axios';
import AuthService from './AuthService';
interface CreateOrderParams {
  productId: number;
  quantity: number;
  billingPeriod?: string;
  variation?: Array<{ attribute: string; value: string }>;
}

interface OrderResponse {
  success: boolean;
  orderId?: number;
  error?: string;
  data?: any;
}

class OrderService {
  private api: AxiosInstance;
  private token = '';
  private WOO_USERNAME = "ck_5761f8ce313356e07555cf14a8c2099ab27d7942";
  private WOO_PASSWORD = "cs_72d03b9110f7f1e3592f5c4a77cbd7c42b176075";
  constructor() {
    this.token = btoa(`${this.WOO_USERNAME}:${this.WOO_PASSWORD}`);
    this.api = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://casamadridista.com/wp-json/wc/v3',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${this.token}`
      }
    });

    // Add response interceptor for consistent error handling
    this.api.interceptors.response.use(
      response => response,
      error => {
        throw new Error(error.response?.data?.message || 'An error occurred');
      }
    );
  }

  async createOrder(params: CreateOrderParams): Promise<OrderResponse> {
    try {
    const user_id = await AuthService.getUserById();
      const response = await this.api.post('/orders', {
        line_items: [
          {
            product_id: params.productId,
            quantity: params.quantity,
            variation: params.variation
          }
        ],
        customer_id: user_id,
        status: OrderStatus.PENDING
      });

      return {
        success: true,
        orderId: response.data.id,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  async getOrder(orderId: number): Promise<OrderResponse> {
    try {
      const data = await this.api.get(`/orders/${orderId}`);

      return {
        success: true,
        data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  async updateOrderStatus(orderId: number, status: OrderStatus): Promise<OrderResponse> {
    try {
      const data = await this.api.put(`/orders/${orderId}`, {
        status
      });

      return {
        success: true,
        data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }
}

export const orderService = new OrderService();