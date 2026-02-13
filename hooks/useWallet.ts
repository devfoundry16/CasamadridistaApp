import { useState, useCallback, useEffect } from 'react';
import WalletService, { Wallet, WalletTransaction } from '@/services/WalletService';

export const useWallet = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const walletData = await WalletService.getWallet();
      setWallet(walletData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTransactions = useCallback(async (limit = 50, offset = 0) => {
    setIsLoading(true);
    setError(null);
    try {
      const txData = await WalletService.getTransactions(limit, offset);
      setTransactions(txData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTopUpIntent = useCallback(async (amount: number, currency = 'usd') => {
    setIsLoading(true);
    setError(null);
    try {
      return await WalletService.createTopUpIntent(amount, currency);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const confirmTopUp = useCallback(async (paymentIntentId: string, amount: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await WalletService.confirmTopUp(paymentIntentId, amount);
      setWallet(result.wallet);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debitWallet = useCallback(async (amount: number, description: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await WalletService.debitWallet(amount, description);
      setWallet(result.wallet);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const transferFunds = useCallback(async (recipientEmail: string, amount: number, message?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await WalletService.transferFunds(recipientEmail, amount, message);
      setWallet(result.wallet);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [walletData, txData] = await Promise.all([
          WalletService.getWallet(),
          WalletService.getTransactions(50, 0),
        ]);
        setWallet(walletData);
        setTransactions(txData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  return {
    wallet,
    transactions,
    isLoading,
    error,
    loadWallet,
    loadTransactions,
    createTopUpIntent,
    confirmTopUp,
    debitWallet,
    transferFunds,
  };
};
