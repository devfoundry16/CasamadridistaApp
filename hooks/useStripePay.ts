import { useUser } from "@/hooks/useUser";
import { PaymentSheet, useStripe } from "@stripe/stripe-react-native";
import { useRef } from "react";
import { useCart } from "./useCart";
import { development } from "@/config/environment";
export const useStripePay = () => {
  const { totalPrice } = useCart();
  const { user } = useUser();
  const billingAddress = user?.billing;
  // const shippingAddress = user?.shipping;

  const orderIdRef = useRef<number>(0);
  /* Stripe */
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const API_URL = `${development.DEFAULT_BACKEND_API_URL}stripe`;

  const handlePayment = async (
    orderId: number,
    walletAmount: number,
    billing?: {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
      address_1?: string;
      address_2?: string;
      city?: string;
      state?: string;
      country?: string;
      postcode?: string;
    }
  ) => {
    // this is only for wallet top-up
    // set a ref immediately so confirmHandler (called by Stripe) can read the up-to-date id
    orderIdRef.current = orderId;
    const effectiveBilling = billing || billingAddress;
    console.log("====stripe id in pay with stripe=====", user?.stripe_id);
    const body = {
      amount: walletAmount ? walletAmount : totalPrice,
      orderId: orderId,
      user: {
        email: effectiveBilling?.email || user?.email,
        name:
          (effectiveBilling?.first_name || user?.name || "") +
          " " +
          (effectiveBilling?.last_name || ""),
        address: {
          city: effectiveBilling?.city,
          country: effectiveBilling?.country,
          state: effectiveBilling?.state,
          postal_code: effectiveBilling?.postcode,
          line1: effectiveBilling?.address_1,
          line2: effectiveBilling?.address_2,
        },
      },
      stripeCustomerId: user?.stripe_id,
    };
    const response = await fetch(`${API_URL}/create-payment-intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    // Call the `intentCreationCallback` with your server response's client secret or error.
    const { paymentIntentId, paymentIntent, ephemeralKey, customer, error } =
      await response.json();
    if (!error && paymentIntent) {
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: paymentIntent,
        applePay: {
          merchantCountryCode: "DE",
        },
        customerId: customer,
        googlePay: {
          merchantCountryCode: "DE",
          testEnv: true,
        },
        customerEphemeralKeySecret: ephemeralKey,
        merchantDisplayName: "My Store",
        defaultBillingDetails: {
          email: effectiveBilling?.email || billingAddress?.email,
          address: {
            city: effectiveBilling?.city || billingAddress?.city,
            country: effectiveBilling?.country || billingAddress?.country,
            state: effectiveBilling?.state || billingAddress?.state,
            postalCode: effectiveBilling?.postcode || billingAddress?.postcode,
            line1: effectiveBilling?.address_1 || billingAddress?.address_1,
            line2: effectiveBilling?.address_2 || billingAddress?.address_2,
          },
        },
        billingDetailsCollectionConfiguration: {
          name: PaymentSheet.CollectionMode.ALWAYS,
          email: PaymentSheet.CollectionMode.ALWAYS,
          phone: PaymentSheet.CollectionMode.AUTOMATIC,
          address: PaymentSheet.AddressCollectionMode.FULL,
          attachDefaultsToPaymentMethod: true,
        },
      });
      if (!initError) {
        const { error } = await presentPaymentSheet();
        if (!error) {
          return { paymentIntent, paymentIntentId, customer };
        } else {
          throw error;
        }
      }
    }
  };
  return {
    initPaymentSheet,
    handlePayment,
  };
};
