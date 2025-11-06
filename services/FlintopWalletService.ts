import {
  FlintopWalletAddFundsRequest,
  FlintopWalletAddFundsResponse,
  FlintopWalletBalance,
  FlintopWalletDetails,
  FlintopWalletTransaction,
  FlinTopWalletTransferRequest,
  FlinTopWalletWithdrawRequest,
} from "@/types/user/flintop-wallet";
import UserService from "./UserService";
import { WP_BASE_URL } from "@env";
export class FlintopWalletService {
  private static readonly BASE_URL = WP_BASE_URL;

  private static async authenticatedFetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await UserService.getAuthToken();

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
      "woo-wallet/v1/balance"
    );
    return data;
  }

  // Get wallet transactions
  static async getTransactions(
    page: number = 1,
    limit: number = 20
  ): Promise<FlintopWalletTransaction[]> {
    const data = await this.authenticatedFetch<FlintopWalletTransaction[]>(
      `woo-wallet/v1/transactions?page=${page}&limit=${limit}`
    );
    return data;
  }

  // Add funds to wallet
  static async addFunds(
    request: FlintopWalletAddFundsRequest
  ): Promise<FlintopWalletAddFundsResponse> {
    return this.authenticatedFetch<FlintopWalletAddFundsResponse>(
      "woo-wallet/v1/add-funds",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
  }

  static async transferFunds(
    request: FlinTopWalletTransferRequest
  ): Promise<any> {
    return this.authenticatedFetch("/woo-wallet/v1/transfer", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Withdraw funds from wallet
  static async withdrawFunds(
    request: FlinTopWalletWithdrawRequest
  ): Promise<any> {
    return this.authenticatedFetch("/woo-wallet/v1/withdraw", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  // Get withdrawal methods
  static async getWithdrawalMethods(): Promise<string[]> {
    return this.authenticatedFetch<string[]>(
      "/woo-wallet/v1/withdrawal-methods"
    );
  }

  // Get payment methods for adding funds
  static async getPaymentMethods(): Promise<string[]> {
    return this.authenticatedFetch<string[]>("/woo-wallet/v1/payment-methods");
  }

  // Get complete wallet details (balance + recent transactions)
  static async getWalletDetails(): Promise<FlintopWalletDetails> {
    return this.authenticatedFetch<FlintopWalletDetails>(
      "/woo-wallet/v1/wallet-details"
    );
  }
}
