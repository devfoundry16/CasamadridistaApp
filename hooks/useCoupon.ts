import { useState, useCallback, useEffect } from 'react';
import CouponService, { Coupon, CouponValidation } from '@/services/CouponService';

export const useCoupon = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCoupons = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await CouponService.getCoupons();
      setCoupons(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCouponByCode = useCallback(async (code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      return await CouponService.getCouponByCode(code);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateCoupon = useCallback(async (code: string, orderAmount: number): Promise<CouponValidation> => {
    setIsLoading(true);
    setError(null);
    try {
      return await CouponService.validateCoupon(code, orderAmount);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyCoupon = useCallback(async (code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await CouponService.applyCoupon(code);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, []);

  return {
    coupons,
    isLoading,
    error,
    loadCoupons,
    getCouponByCode,
    validateCoupon,
    applyCoupon,
  };
};
