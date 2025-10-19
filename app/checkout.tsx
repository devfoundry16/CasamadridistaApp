import HeaderStack from "@/components/HeaderStack";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import {
  IntentCreationCallbackParams,
  PaymentMethod,
  PaymentSheetError,
  useStripe,
} from "@stripe/stripe-react-native";
import { useRouter } from "expo-router";
import { CheckCircle, CreditCard, MapPin, User } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCart();
  const { billingAddress, shippingAddress, user} = useAuth();
  const [name, setName] = useState(user?.name);
  const [email, setEmail] = useState(user?.email);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState(billingAddress);
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
        name: billingAddress?.first_name + ' ' + billingAddress?.last_name,
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
    const body = { amount: totalPrice};
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
    if (!name || !email || !address) {
      Alert.alert(
        "Missing Information",
        "Please fill in all fields to complete your purchase."
      );
      return;
    }

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

  if (items.length === 0) {
    return (
      <>
        <HeaderStack title="Checkout" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your cart is empty</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <HeaderStack title="Checkout" />
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <User size={20} color={Colors.darkGold} />
                <Text style={styles.sectionTitle}>Personal Information</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={Colors.textSecondary}
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor={Colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor={Colors.textSecondary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MapPin size={20} color={Colors.darkGold} />
                <Text style={styles.sectionTitle}>Shipping Address</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Street Address, City, State, ZIP Code"
                placeholderTextColor={Colors.textSecondary}
                value={address?.address_1 + ' ' + address?.city + ' ' + address?.state + ' ' + address?.postalCode}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <CreditCard size={20} color={Colors.darkGold} />
                <Text style={styles.sectionTitle}>Payment Information</Text>
              </View>
            </View>

            <View style={styles.orderSummary}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              {items.map((item) => (
                <View key={item.id} style={styles.summaryItem}>
                  <Text style={styles.summaryItemName}>
                    {item.name} x {item.quantity}
                  </Text>
                  <Text style={styles.summaryItemPrice}>
                    ${(Number(item.prices.price) / 100 * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}
              <View style={styles.divider} />
              <View style={styles.summaryItem}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalPrice}>${(totalPrice / 100).toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.payButton}
            onPress={handlePayment}
            activeOpacity={0.8}
          >
            <CheckCircle size={20} color={Colors.darkBg} />
            <Text style={styles.payButtonText}>Complete Payment</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deepDarkGray,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.darkBg,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  orderSummary: {
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryItemName: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  summaryItemPrice: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.darkGold,
  },
  footer: {
    backgroundColor: Colors.cardBg,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  payButton: {
    backgroundColor: Colors.darkGold,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.darkBg,
  },
});
