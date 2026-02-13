import { useState, useCallback } from 'react';
import DonationService, { Donation, DonationStats } from '@/services/DonationService';

export const useDonation = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDonations = useCallback(async (limit = 50, offset = 0, campaignName?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await DonationService.getDonations(limit, offset, campaignName);
      setDonations(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDonationStats = useCallback(async (campaignName?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await DonationService.getDonationStats(campaignName);
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createDonationIntent = useCallback(
    async (data: {
      amount: number;
      currency?: string;
      campaignName?: string;
      donorName?: string;
      donorEmail?: string;
      message?: string;
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        return await DonationService.createDonationIntent(data);
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const confirmDonation = useCallback(
    async (data: {
      paymentIntentId: string;
      amount: number;
      campaignName?: string;
      donorName?: string;
      donorEmail?: string;
      message?: string;
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await DonationService.confirmDonation(data);
        await loadDonations();
        return result;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [loadDonations]
  );

  return {
    donations,
    stats,
    isLoading,
    error,
    loadDonations,
    loadDonationStats,
    createDonationIntent,
    confirmDonation,
  };
};
