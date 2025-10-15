// types/wallet.ts
export interface WalletBalance {
  balance: number;
  currency: string;
  user_id: number;
}

export interface WalletTransaction {
  id: number;
  user_id: number;
  type: 'credit' | 'debit';
  amount: number;
  balance: number;
  description: string;
  date: string;
  reference: string;
}

export interface AddFundsRequest {
  user_id: number;
  amount: number;
  payment_method: string;
  description?: string;
}

export interface AddFundsResponse {
  success: boolean;
  new_balance: number;
  transaction_id: number;
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  data?: any;
}

export interface AuthResponse {
  token: string;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
  user_id: number;
}