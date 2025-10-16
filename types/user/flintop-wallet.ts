// types/flintop-wallet.ts
export interface FlintopWalletBalance {
  balance: number;
  currency: string;
  currency_symbol: string;
  formatted_balance: string;
  user_id: number;
  plugin: string;
}

export interface FlintopWalletTransaction {
  id: number;
  user_id: number;
  type: 'credit' | 'debit';
  amount: number;
  balance: number;
  currency: string;
  details?: string;
  date: string;
  order_id: number;
  created_by?: number;
}

export interface FlintopWalletAddFundsRequest {
  amount: number;
  payment_method: string;
  description?: string;
}

export interface FlintopWalletAddFundsResponse {
  success: boolean;
  message: string;
  new_balance: number;
  transaction_id: number;
  currency: string;
}

export interface FlintopWalletDetails {
  balance: {
    amount: number;
    currency: string;
    currency_symbol: string;
    formatted: string;
  };
  recent_transactions: FlintopWalletTransaction[];
  user_id: number;
}