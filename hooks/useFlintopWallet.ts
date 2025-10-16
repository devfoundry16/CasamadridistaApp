// hooks/useFlintopWallet.ts
import AuthService from '@/services/AuthService';
import { FlintopWalletService } from '@/services/FlintopWalletService';
import { FlintopWalletBalance, FlintopWalletTransaction } from '@/types/user/flintop-wallet';
import { useCallback, useEffect, useState } from 'react';

interface UseFlintopWalletReturn {
  balance: FlintopWalletBalance | null;
  transactions: FlintopWalletTransaction[];
  loading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  addFunds: (amount: number, paymentMethod: string, description?: string) => Promise<void>;
  testConnection: () => Promise<{ success: boolean; message: string }>;
}

export const useFlintopWallet = (): UseFlintopWalletReturn => {
  const [balance, setBalance] = useState<FlintopWalletBalance | null>(null);
  const [transactions, setTransactions] = useState<FlintopWalletTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadWalletData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const isAuthenticated = await AuthService.isAuthenticated();
      if (!isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const [balanceData, transactionsData] = await Promise.all([
        FlintopWalletService.getBalance(),
        FlintopWalletService.getTransactions(),
      ]);
      setBalance(balanceData);
      setTransactions(transactionsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Flintop Wallet Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    try {
      const balanceData = await FlintopWalletService.getBalance();
      setBalance(balanceData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh balance';
      setError(errorMessage);
    }
  }, []);

  const refreshTransactions = useCallback(async () => {
    try {
      const transactionsData = await FlintopWalletService.getTransactions();
      setTransactions(transactionsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh transactions';
      setError(errorMessage);
    }
  }, []);

  const addFunds = useCallback(async (amount: number, paymentMethod: string, description?: string) => {
    try {
      setError(null);
      
      await FlintopWalletService.addFunds({
        amount,
        payment_method: paymentMethod,
        description: description || `Added funds via mobile app using ${paymentMethod}`,
      });

      await refreshBalance();
      await refreshTransactions();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add funds';
      setError(errorMessage);
      throw err;
    }
  }, [refreshBalance, refreshTransactions]);

  const testConnection = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    return await FlintopWalletService.testConnection();
  }, []);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  return {
    balance,
    transactions,
    loading,
    error,
    refreshBalance,
    refreshTransactions,
    addFunds,
    testConnection,
  };
};