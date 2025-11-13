import { CHECKOUT_PRODUCT_TYPE } from "@/types/shop/checkout";

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const parseAmount = (num: number): string => {
  return num.toLocaleString("en-US");
};

export const getProductType = (line_items: any[]) => {
  // Determine the product type from order line items.
  // - Wallet top-ups are represented by the Flintop wallet product id (52365)
  // - Subscriptions include a variation/attribute for billing period (pa_billing-period or 'Billing Period')
  // - Otherwise default to STANDARD
  const items: any[] = (line_items as any) || [];
  if (items.length === 0) return CHECKOUT_PRODUCT_TYPE.STANDARD;

  // Wallet product id used in AddFundsModal
  const WALLET_PRODUCT_ID = 52365;
  if (items.some((it) => Number(it.product_id) === WALLET_PRODUCT_ID)) {
    return CHECKOUT_PRODUCT_TYPE.WALLET;
  }

  // Look for a billing-period attribute used for subscriptions
  const isSubscription = items.some((it) => {
    const variations = it.meta_data || [];
    return variations.some((v: any) => {
      const key = (v.key || "").toString().toLowerCase();
      return (
        key.includes("billing") ||
        key.includes("pa_billing-period") ||
        key.includes("billing-period")
      );
    });
  });

  if (isSubscription) return CHECKOUT_PRODUCT_TYPE.SUBSCRIPTION;

  return CHECKOUT_PRODUCT_TYPE.STANDARD;
};
