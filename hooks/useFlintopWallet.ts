// hooks/useFlintopWallet.ts
import { FlintopWalletService } from "@/services/FlintopWalletService";
import UserService from "@/services/UserService";
import {
  FlintopWalletBalance,
  FlintopWalletTransaction,
} from "@/types/user/flintop-wallet";
import { useCallback, useEffect, useState } from "react";

interface UseFlintopWalletReturn {
  balance: FlintopWalletBalance | null;
  transactions: FlintopWalletTransaction[];
  loading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  addFunds: (
    amount: number,
    order_id: number,
    paymentMethod: string,
    description?: string
  ) => Promise<void>;
  transferFunds: (
    toUserId: number,
    amount: number,
    description?: string
  ) => Promise<void>;
  withdrawFunds: (
    amount: number,
    order_id: number,
    paymentMethod: string,
    description?: string
  ) => Promise<any>;
  testConnection: () => Promise<{ success: boolean; message: string }>;
}

export const useFlintopWallet = (): UseFlintopWalletReturn => {
  const [balance, setBalance] = useState<FlintopWalletBalance | null>(null);
  const [transactions, setTransactions] = useState<FlintopWalletTransaction[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadWalletData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const isAuthenticated = await UserService.isAuthenticated();
      if (!isAuthenticated) {
        throw new Error("User not authenticated");
      }

      const [testData, balanceData, transactionsData] = await Promise.all([
        FlintopWalletService.testConnection(),
        FlintopWalletService.getBalance(),
        FlintopWalletService.getTransactions(),
      ]);
      setBalance(balanceData);
      setTransactions(transactionsData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      console.error("Flintop Wallet Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    try {
      const balanceData = await FlintopWalletService.getBalance();
      setBalance(balanceData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to refresh balance";
      setError(errorMessage);
    }
  }, []);

  const refreshTransactions = useCallback(async () => {
    try {
      const transactionsData = await FlintopWalletService.getTransactions();
      setTransactions(transactionsData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to refresh transactions";
      setError(errorMessage);
    }
  }, []);

  const addFunds = useCallback(
    async (
      amount: number,
      order_id: number,
      paymentMethod: string,
      description?: string
    ) => {
      try {
        setError(null);
        await FlintopWalletService.addFunds({
          amount,
          order_id,
          payment_method: paymentMethod,
          description:
            description || `Added funds via mobile app using ${paymentMethod}`,
        });

        await refreshBalance();
        await refreshTransactions();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to add funds";
        setError(errorMessage);
        throw err;
      }
    },
    [refreshBalance, refreshTransactions]
  );

  const transferFunds = useCallback(
    async (toUserId: number, amount: number, description?: string) => {
      try {
        setError(null);

        await FlintopWalletService.transferFunds({
          to_user_id: toUserId,
          amount,
          description: description || `Transfer to user ${toUserId}`,
        });

        await refreshBalance();
        await refreshTransactions();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to transfer funds"
        );
        throw err;
      }
    },
    [refreshBalance, refreshTransactions]
  );

  const withdrawFunds = useCallback(
    async (
      amount: number,
      order_id: number,
      paymentMethod: string,
      description?: string
    ) => {
      try {
        setError(null);
        const resp = await FlintopWalletService.withdrawFunds({
          amount: amount / 100,
          order_id,
          payment_method: paymentMethod,
          description:
            description || `Withdraw via mobile app using ${paymentMethod}`,
        });

        await refreshBalance();
        await refreshTransactions();

        return resp;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to withdraw funds"
        );
        throw err;
      }
    },
    [refreshBalance, refreshTransactions]
  );

  const testConnection = useCallback(async (): Promise<{
    success: boolean;
    message: string;
  }> => {
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
    transferFunds,
    withdrawFunds,
    testConnection,
  };
};
