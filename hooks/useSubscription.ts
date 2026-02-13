import { useState, useCallback, useEffect } from 'react';
import SubscriptionService, { Subscription } from '@/services/SubscriptionService';

export const useSubscription = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubscriptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await SubscriptionService.getSubscriptions();
      setSubscriptions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadActiveSubscription = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await SubscriptionService.getActiveSubscription();
      setActiveSubscription(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSubscription = useCallback(
    async (data: {
      subscriptionType: string;
      price: number;
      currency?: string;
      endDate?: string;
      receiptData?: any;
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        const subscription = await SubscriptionService.createSubscription(data);
        setActiveSubscription(subscription);
        await loadSubscriptions();
        return subscription;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [loadSubscriptions]
  );

  const updateSubscription = useCallback(
    async (
      id: string,
      data: {
        status?: 'active' | 'cancelled' | 'expired';
        endDate?: string;
        receiptData?: any;
      }
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const subscription = await SubscriptionService.updateSubscription(id, data);
        await loadSubscriptions();
        await loadActiveSubscription();
        return subscription;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [loadSubscriptions, loadActiveSubscription]
  );

  const cancelSubscription = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const subscription = await SubscriptionService.cancelSubscription(id);
        await loadSubscriptions();
        await loadActiveSubscription();
        return subscription;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [loadSubscriptions, loadActiveSubscription]
  );

  const deleteSubscription = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await SubscriptionService.deleteSubscription(id);
        await loadSubscriptions();
        await loadActiveSubscription();
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [loadSubscriptions, loadActiveSubscription]
  );

  useEffect(() => {
    loadSubscriptions();
    loadActiveSubscription();
  }, []);

  return {
    subscriptions,
    activeSubscription,
    isLoading,
    error,
    loadSubscriptions,
    loadActiveSubscription,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    deleteSubscription,
  };
};
