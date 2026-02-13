import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config/supabase';
import AuthService from './AuthService';

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  payment_method: string;
  stripe_payment_intent_id?: string;
  metadata?: any;
  created_at: string;
}

class WalletServiceClass {
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
   * Executes an authenticated request and retries once on expired token.
   */
  private async requestWithAuth<T>(
    requestFn: (headers: Record<string, string>) => Promise<{ data: T }>
  ): Promise<T> {
    let headers = await this.getAuthHeader();

    try {
      const response = await requestFn(headers);
      return response.data;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401) {
        const newAccessToken = await AuthService.refreshToken();
        headers = { Authorization: `Bearer ${newAccessToken}` };
        const retryResponse = await requestFn(headers);
        return retryResponse.data;
      }
      throw error;
    }
  }

  /**
   * Get user wallet
   */
  async getWallet(): Promise<Wallet> {
    try {
      return await this.requestWithAuth<Wallet>((headers) =>
        axios.get(`${API_BASE_URL}wallet`, { headers })
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get wallet');
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<number> {
    try {
      const wallet = await this.getWallet();
      return wallet.balance;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get wallet transactions
   */
  async getTransactions(limit: number = 50, offset: number = 0): Promise<WalletTransaction[]> {
    try {
      return await this.requestWithAuth<WalletTransaction[]>((headers) =>
        axios.get(`${API_BASE_URL}wallet/transactions`, {
          headers,
          params: { limit, offset },
        })
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get transactions');
    }
  }

  /**
   * Create Stripe payment intent for wallet top-up
   */
  async createTopUpIntent(amount: number, currency: string = 'usd'): Promise<{
    clientSecret: string;
    paymentIntentId: string;
  }> {
    try {
      return await this.requestWithAuth<{
        clientSecret: string;
        paymentIntentId: string;
      }>((headers) =>
        axios.post(
          `${API_BASE_URL}wallet/topup/intent`,
          { amount, currency },
          { headers }
        )
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create top-up intent');
    }
  }

  /**
   * Confirm wallet top-up after Stripe payment
   */
  async confirmTopUp(paymentIntentId: string, amount: number): Promise<{
    transaction: WalletTransaction;
    wallet: Wallet;
  }> {
    try {
      return await this.requestWithAuth<{
        transaction: WalletTransaction;
        wallet: Wallet;
      }>((headers) =>
        axios.post(
          `${API_BASE_URL}wallet/topup/confirm`,
          { paymentIntentId, amount },
          { headers }
        )
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to confirm top-up');
    }
  }

  /**
   * Debit wallet (for purchases)
   */
  async debitWallet(amount: number, description: string): Promise<{
    transaction: WalletTransaction;
    wallet: Wallet;
  }> {
    try {
      return await this.requestWithAuth<{
        transaction: WalletTransaction;
        wallet: Wallet;
      }>((headers) =>
        axios.post(
          `${API_BASE_URL}wallet/debit`,
          { amount, description },
          { headers }
        )
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to debit wallet');
    }
  }

  /**
   * Transfer funds to another user
   */
  async transferFunds(
    recipientEmail: string,
    amount: number,
    message?: string
  ): Promise<{
    message: string;
    transaction: WalletTransaction;
    wallet: Wallet;
  }> {
    try {
      return await this.requestWithAuth<{
        message: string;
        transaction: WalletTransaction;
        wallet: Wallet;
      }>((headers) =>
        axios.post(
          `${API_BASE_URL}wallet/transfer`,
          { recipientEmail, amount, message },
          { headers }
        )
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to transfer funds');
    }
  }
}

const WalletService = new WalletServiceClass();
export default WalletService;
