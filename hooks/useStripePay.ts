import { useAuth } from "@/contexts/AuthContext";
import {
  IntentCreationCallbackParams,
  PaymentMethod,
  PaymentSheetError,
  useStripe,
} from "@stripe/stripe-react-native";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { useCart } from "./useCart";

export const useStripePay = () => {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const { billingAddress, shippingAddress, user } = useAuth();
  /* Stripe */
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const API_URL = "http://localhost:3000";

  const initializePaymentSheet = async () => {
    const { error } = await initPaymentSheet({
      merchantDisplayName: "Example, Inc.",
      applePay: {
        merchantCountryCode: "US",
      },
      googlePay: {
        merchantCountryCode: "US",
      },
      defaultBillingDetails: {
        email: billingAddress?.email,
        name: billingAddress?.first_name + " " + billingAddress?.last_name,
        address: {
          city: billingAddress?.city,
          country: billingAddress?.country,
          line1: billingAddress?.address_1,
          line2: billingAddress?.address_2,
          state: billingAddress?.state,
        },
      },
      defaultShippingDetails: {
        name: shippingAddress?.first_name + " " + shippingAddress?.last_name,
        phone: shippingAddress?.phone,
        address: {
          city: shippingAddress?.city,
          country: shippingAddress?.country,
          line1: shippingAddress?.address_1,
          line2: shippingAddress?.address_2,
          state: shippingAddress?.state,
        },
      },
      intentConfiguration: {
        mode: {
          amount: totalPrice,
          currencyCode: "usd",
        },
        confirmHandler: confirmHandler,
      },
    });
    if (error) {
      // Handle error
    }
  };

  const confirmHandler = async (
    paymentMethod: PaymentMethod.Result,
    shouldSavePaymentMethod: boolean,
    intentCreationCallback: (params: IntentCreationCallbackParams) => void
  ) => {
    // Make a request to your own server.
    const body = { amount: totalPrice };
    const response = await fetch(`${API_URL}/create-payment-intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    // Call the `intentCreationCallback` with your server response's client secret or error.
    const { client_secret, error } = await response.json();
    if (client_secret) {
      intentCreationCallback({ clientSecret: client_secret });
    } else {
      intentCreationCallback({ error });
    }
  };
  const handlePayment = async () => {
    initializePaymentSheet();
    const { error } = await presentPaymentSheet();
    if (error) {
      if (error.code === PaymentSheetError.Canceled) {
        // Customer canceled - you should probably do nothing.
      } else {
        // PaymentSheet encountered an unrecoverable error. You can display the error to the user, log it, and so on.
      }
    } else {
      Alert.alert(
        "Payment Successful!",
        `Your order of $${(totalPrice / 100).toFixed(2)} has been confirmed. Thank you for shopping with us!`,
        [
          {
            text: "Continue Shopping",
            onPress: () => {
              clearCart();
              router.push("/shop");
            },
          },
        ]
      );
    }
  };
  return {
    initPaymentSheet,
    confirmHandler,
    handlePayment,
  };
};
