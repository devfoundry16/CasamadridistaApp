import { useCallback, useMemo, useState } from "react";
import PayPalService from "@/services/PayPalService";
import { development } from "@/config/environment";
interface UsePayPalReturn {
  loading: boolean;
  error: string | null;
  createOrder: (
    amount: number,
    description?: string,
    orderId?: number
  ) => Promise<{
    id: string;
    approvalUrl: string;
  } | null>;
  captureOrder: (orderID: string, payerID?: string) => Promise<any>;
  getOrderDetails: (orderID: string) => Promise<any>;
}

export const usePayPal = (): UsePayPalReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize PayPal service - memoize to avoid recreating on every render
  const paypalService = useMemo(() => {
    return new PayPalService({
      clientId: development.PAYPAL_CLIENT_ID || "",
      clientSecret: development.PAYPAL_CLIENT_SECRET || "",
      mode: (development.PAYPAL_MODE as "sandbox" | "live") || "sandbox",
    });
  }, []);

  const createOrder = useCallback(
    async (amount: number, description?: string, orderId?: number) => {
      try {
        setLoading(true);
        setError(null);

        const returnUrl = `${development.DEFAULT_BACKEND_API_URL}/return?orderId=${orderId}`;
        const cancelUrl = `${development.DEFAULT_BACKEND_API_URL}/cancel`;

        const orderData = await paypalService.createOrder(
          {
            amount,
            currency: "USD",
            orderDescription: description || "Order Payment",
            pendingOrderId: orderId,
          },
          returnUrl,
          cancelUrl
        );

        const approvalLink = orderData.links?.find(
          (link: any) => link.rel === "approve"
        );

        if (!approvalLink?.href) {
          throw new Error("No approval link found in PayPal response");
        }

        setLoading(false);

        return {
          id: orderData.id,
          approvalUrl: approvalLink.href,
        };
      } catch (err: any) {
        const errorMsg = err.message || "Failed to create PayPal order";
        setError(errorMsg);
        setLoading(false);
        throw err;
      }
    },
    [paypalService]
  );

  const captureOrder = useCallback(
    async (orderID: string, payerID?: string) => {
      try {
        setLoading(true);
        setError(null);

        const captureData = await paypalService.captureOrder({
          orderID,
          payerID,
        });

        setLoading(false);

        return captureData;
      } catch (err: any) {
        const errorMsg = err.message || "Failed to capture PayPal order";
        setError(errorMsg);
        setLoading(false);
        throw err;
      }
    },
    [paypalService]
  );

  const getOrderDetails = useCallback(
    async (orderID: string) => {
      try {
        setLoading(true);
        setError(null);

        const orderDetails = await paypalService.getOrderDetails(orderID);

        setLoading(false);

        return orderDetails;
      } catch (err: any) {
        const errorMsg = err.message || "Failed to get PayPal order details";
        setError(errorMsg);
        setLoading(false);
        throw err;
      }
    },
    [paypalService]
  );

  return {
    loading,
    error,
    createOrder,
    captureOrder,
    getOrderDetails,
  };
};
