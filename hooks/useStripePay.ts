import { useAuth } from "@/contexts/AuthContext";
import { PaymentSheet, useStripe } from "@stripe/stripe-react-native";
import { useRouter } from "expo-router";
import { useRef } from "react";
import { useCart } from "./useCart";

export const useStripePay = () => {
  const { totalPrice, clearCart } = useCart();
  const router = useRouter();
  const { user } = useAuth();
  const billingAddress = user?.billing;
  const shippingAddress = user?.shipping;

  const orderIdRef = useRef<number>(0);
  /* Stripe */
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const API_URL = "http://localhost:3000";

  const handlePayment = async (orderId: number) => {
    // set a ref immediately so confirmHandler (called by Stripe) can read the up-to-date id
    orderIdRef.current = orderId;
    const body = { amount: totalPrice, orderId: orderId };
    const response = await fetch(`${API_URL}/create-payment-intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    // Call the `intentCreationCallback` with your server response's client secret or error.
    const { client_secret, intent, error } = await response.json();
    if (!error && client_secret) {
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: client_secret,
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
          return intent;
        } else {
          throw error;
        }
      }
    }
  };
  // const { error } = await presentPaymentSheet();
  // if (error) {
  //   if (error.code === PaymentSheetError.Canceled) {
  //     // Customer canceled - you should probably do nothing.
  //   } else {
  //     // PaymentSheet encountered an unrecoverable error. You can display the error to the user, log it, and so on.
  //   }
  // } else {
  //   Alert.alert(
  //     "Payment Successful!",
  //     `Your order of $${(totalPrice / 100).toFixed(2)} has been confirmed. Thank you for shopping with us!`,
  //     [
  //       {
  //         text: "Continue Shopping",
  //         onPress: () => {
  //           router.push("/shop");
  //         },
  //       },
  //     ]
  //   );
  // }
  return {
    initPaymentSheet,
    handlePayment,
  };
};
