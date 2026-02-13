import { useUser } from "@/hooks/useUser";
import { PaymentSheet, useStripe } from "@stripe/stripe-react-native";
export const useStripePay = () => {
  const { user } = useUser();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const payWithClientSecret = async (clientSecret: string) => {
    if (!clientSecret) {
      throw new Error("Missing Stripe client secret");
    }

    const { error: initError } = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      applePay: {
        merchantCountryCode: "DE",
      },
      googlePay: {
        merchantCountryCode: "DE",
        testEnv: true,
      },
      merchantDisplayName: "Casa Madridista",
      defaultBillingDetails: {
        email: user?.email,
      },
      billingDetailsCollectionConfiguration: {
        name: PaymentSheet.CollectionMode.ALWAYS,
        email: PaymentSheet.CollectionMode.ALWAYS,
        phone: PaymentSheet.CollectionMode.AUTOMATIC,
        address: PaymentSheet.AddressCollectionMode.NEVER,
        attachDefaultsToPaymentMethod: true,
      },
    });

    if (initError) {
      throw new Error(initError.message || "Failed to initialize payment sheet");
    }

    const { error } = await presentPaymentSheet();
    if (error) {
      throw new Error(error.message || "Payment was not completed");
    }

    return { success: true };
  };
  return {
    initPaymentSheet,
    payWithClientSecret,
  };
};
