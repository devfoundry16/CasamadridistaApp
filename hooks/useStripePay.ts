import { useUser } from "@/hooks/useUser";
import { PaymentSheet, useStripe } from "@stripe/stripe-react-native";
import { useRef } from "react";
import { useCart } from "./useCart";

export const useStripePay = () => {
  const { totalPrice } = useCart();
  const { user } = useUser();
  const billingAddress = user?.billing;
  // const shippingAddress = user?.shipping;

  const orderIdRef = useRef<number>(0);
  /* Stripe */
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const API_URL = "http://localhost:3000/api/stripe";

  const handlePayment = async (orderId: number, walletAmount: number) => {
    console.log(walletAmount);
    // this is only for wallet top-up
    // set a ref immediately so confirmHandler (called by Stripe) can read the up-to-date id
    orderIdRef.current = orderId;
    const body = {
      amount: walletAmount ? walletAmount * 100 : totalPrice,
      orderId: orderId,
      user: {
        email: user?.email,
        name: user?.name,
        address: {
          city: billingAddress?.city,
          country: billingAddress?.country,
          state: billingAddress?.state,
          postal_code: billingAddress?.postcode,
          line1: billingAddress?.address_1,
          line2: billingAddress?.address_2,
        },
      },
    };
    const response = await fetch(`${API_URL}/create-payment-intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    // Call the `intentCreationCallback` with your server response's client secret or error.
    const { paymentIntent, customer, error } = await response.json();
    if (!error && paymentIntent) {
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: paymentIntent,
        applePay: {
          merchantCountryCode: "DE",
        },
        googlePay: {
          merchantCountryCode: "DE",
          testEnv: true,
        },
        merchantDisplayName: "My Store",
        defaultBillingDetails: {
          email: billingAddress?.email,
          address: {
            ...billingAddress,
            postalCode: billingAddress?.postcode,
            line1: billingAddress?.address_1,
            line2: billingAddress?.address_2,
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
        const { error: paymentError } = await presentPaymentSheet();
        if (!paymentError) {
          return { paymentIntent, customer };
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
