import {
  FlintopWalletAddFundsRequest,
  FlintopWalletAddFundsResponse,
  FlintopWalletBalance,
  FlintopWalletDetails,
  FlintopWalletTransaction,
} from "@/types/user/flintop-wallet";
import AuthService from "./AuthService";

export class FlintopWalletService {
  private static readonly BASE_URL = "https://casamadridista.com/wp-json";

  private static async authenticatedFetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await AuthService.getAuthToken();

    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }

    const defaultOptions: RequestInit = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific FlinTop wallet errors
        if (
          error.message.includes("WooCommerce Wallet by FlinTop is not active")
        ) {
          throw new Error("Wallet plugin not active. Please contact support.");
        }
        throw error;
      }
      throw new Error("Network error occurred. Please check your connection.");
    }
  }

  // Test FlinTop wallet connection
  static async testConnection(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await this.getBalance();
      return {
        success: true,
        message: `FlinTop Wallet connected! Balance: ${response.balance}`,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to connect to wallet",
      };
    }
  }

  // Get wallet balance
  static async getBalance(): Promise<FlintopWalletBalance> {
    const data = await this.authenticatedFetch<FlintopWalletBalance>(
      "/woo-wallet/v1/balance"
    );
    console.log(data);
    return data;
  }

  // Get wallet transactions
  static async getTransactions(
    page: number = 1,
    limit: number = 20
  ): Promise<FlintopWalletTransaction[]> {
    const data = await this.authenticatedFetch<FlintopWalletTransaction[]>(
      `/woo-wallet/v1/transactions?page=${page}&limit=${limit}`
    );
    console.log(data);
    return data;
  }

  // Add funds to wallet
  static async addFunds(
    request: FlintopWalletAddFundsRequest
  ): Promise<FlintopWalletAddFundsResponse> {
    return this.authenticatedFetch<FlintopWalletAddFundsResponse>(
      "/woo-wallet/v1/add-funds",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
  }

  // Get complete wallet details (balance + recent transactions)
  static async getWalletDetails(): Promise<FlintopWalletDetails> {
    return this.authenticatedFetch<FlintopWalletDetails>(
      "/woo-wallet/v1/wallet-details"
    );
  }
}
