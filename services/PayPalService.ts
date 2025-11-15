import axios, { AxiosInstance } from "axios";

interface CreateOrderRequest {
  amount: number;
  currency?: string;
  orderDescription?: string;
  pendingOrderId?: number;
}

interface CreateOrderResponse {
  id: string;
  status: string;
  links: {
    rel: string;
    href: string;
    method: string;
  }[];
}

interface CaptureOrderRequest {
  orderID: string;
  payerID?: string;
  pendingOrderId?: number;
}

interface CaptureOrderResponse {
  id: string;
  status: string;
  payer?: {
    email_address?: string;
    name?: {
      given_name?: string;
      surname?: string;
    };
  };
  purchase_units?: {
    amount: {
      value: string;
      currency_code: string;
    };
  }[];
}

interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  mode: "sandbox" | "live";
}

class PayPalService {
  private apiClient: AxiosInstance;
  private config: PayPalConfig;

  constructor(config: PayPalConfig) {
    this.config = config;

    const baseURL =
      config.mode === "sandbox"
        ? "https://api.sandbox.paypal.com"
        : "https://api.paypal.com";

    this.apiClient = axios.create({
      baseURL,
      timeout: 10000,
    });
  }

  /**
   * Get PayPal access token
   */
  private async getAccessToken(): Promise<string> {
    try {
      const auth = Buffer.from(
        `${this.config.clientId}:${this.config.clientSecret}`
      ).toString("base64");

      const response = await axios.post(
        `${
          this.config.mode === "sandbox"
            ? "https://api.sandbox.paypal.com"
            : "https://api.paypal.com"
        }/v1/oauth2/token`,
        "grant_type=client_credentials",
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error("PayPal Access Token Error:", error);
      throw new Error("Failed to get PayPal access token");
    }
  }

  /**
   * Create a PayPal order
   */
  async createOrder(
    data: CreateOrderRequest,
    returnUrl: string,
    cancelUrl: string
  ): Promise<CreateOrderResponse> {
    try {
      const accessToken = await this.getAccessToken();

      const orderData = {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: data.currency || "USD",
              value: data.amount.toFixed(2), // Convert cents to dollars
            },
            description: data.orderDescription || "Order payment",
          },
        ],
        application_context: {
          return_url: returnUrl,
          cancel_url: cancelUrl,
          shipping_preference: "NO_SHIPPING",
        },
      };

      const response = await this.apiClient.post<CreateOrderResponse>(
        "/v2/checkout/orders",
        orderData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("PayPal Create Order Error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create PayPal order"
      );
    }
  }

  /**
   * Capture a PayPal order
   */
  async captureOrder(data: CaptureOrderRequest): Promise<CaptureOrderResponse> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await this.apiClient.post<CaptureOrderResponse>(
        `/v2/checkout/orders/${data.orderID}/capture`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("PayPal Capture Order Error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to capture PayPal order"
      );
    }
  }

  /**
   * Get PayPal order details
   */
  async getOrderDetails(orderID: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await this.apiClient.get(
        `/v2/checkout/orders/${orderID}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("PayPal Get Order Details Error:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to get PayPal order details"
      );
    }
  }
}

export default PayPalService;
