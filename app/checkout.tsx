import HeaderStack from "@/components/HeaderStack";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { useFlintopWallet } from "@/hooks/useFlintopWallet";
import { useOrder } from "@/hooks/useOrder";
import { useStripePay } from "@/hooks/useStripePay";
import {
  CHECKOUT_PAYMENT_METHOD,
  CHECKOUT_PRODUCT_TYPE,
} from "@/types/shop/checkout";
import { OrderStatus } from "@/types/shop/order";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle, User } from "lucide-react-native";
import React, { useState } from "react";
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
  const { productType, amount } = useLocalSearchParams();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const { addOrder, updateOrder, createSubscriptionOrder } = useOrder();
  const billingAddress = user?.billing;
  const shippingAddress = user?.shipping;
  const [name, setName] = useState(
    billingAddress?.first_name + " " + billingAddress?.last_name
  );
  const [email, setEmail] = useState(billingAddress?.email);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState(shippingAddress);
  const [status, setStatus] = useState<boolean>(false); //false means place an order, true means paying
  const [orderId, setOrderId] = useState<number | null>(null);
  const { handlePayment: payViaStripe } = useStripePay();
  const { addFunds } = useFlintopWallet();

  const preparePayload = () => {
    return {
      payment_method: CHECKOUT_PAYMENT_METHOD.STRIPE, // or 'paypal', etc.
      payment_method_title: "Credit/Debit Card",
      set_paid: false, // Let the payment gateway handle the payment
      customer_id: user?.id,
      billing: user?.billing,
      shipping: user?.shipping,
      line_items:
        items.map((item) => {
          return {
            product_id: item.id, // The ID of your subscription product
            quantity: item.quantity,
          };
        }) || [],
    };
  };

  const placeOrder = (payload: any) => {
    addOrder(payload).then((data) => {
      console.log(
        "order id:",
        data.id,
        "status: ",
        data.status,
        "customer_id:",
        data.customer_id,
        "total: ",
        data.total
      );
      setOrderId(data.id);
      setStatus(data.status === OrderStatus.PENDING ? true : false);
    });
  };

  const createSubscription = async (order_id: number) => {
    createSubscriptionOrder(order_id).then(() => {
      setStatus(false);
      setOrderId(null);
    });
  };

  const addFundsToWallet = async (order_id: number) => {
    await addFunds(Number(amount), CHECKOUT_PAYMENT_METHOD.STRIPE);
  };

  const stripePay = () => {
    if (orderId) {
      payViaStripe(
        orderId,
        productType === CHECKOUT_PRODUCT_TYPE.WALLET ? Number(amount) : 0
      )
        .then((res) => {
          updateOrder(orderId, {
            payment_method: CHECKOUT_PAYMENT_METHOD.STRIPE,
            payment_method_title: "Credit/Debit Card",
            set_paid: true,
            status: OrderStatus.PROCESSING,
            meta_data: [
              {
                key: "_stripe_payment_intent",
                value: res?.paymentIntent,
              },
              {
                key: "_stripe_customer_id",
                value: res?.customer,
              },
            ],
          }).then(async () => {
            if (productType === CHECKOUT_PRODUCT_TYPE.SUBSCRIPTION)
              await createSubscription(orderId);
            else if (productType === CHECKOUT_PRODUCT_TYPE.WALLET)
              await addFundsToWallet(orderId);
            clearCart();
            router.push("/cart");
            Alert.alert(
              "Payment Successful",
              "Your payment was processed successfully!"
            );
          });
        })
        .catch((error) => {
          Alert.alert(
            "Payment Failed",
            "There was an issue processing your payment."
          );
        });
    }
  };

  const handlePayment = async () => {
    if (!name || !email || !address || items.length === 0) {
      Alert.alert(
        "Missing Information",
        "Please fill in all fields to complete your purchase."
      );
      return;
    }
    if (status == false) {
      // place an order
      try {
        const payload = preparePayload();
        placeOrder(payload);
      } catch (error: any) {
        Alert.alert(
          "Order Failed",
          `There was an issue placing your order. ${error.message}`
        );
      }
    } else {
      // continue payment
      try {
        stripePay();
      } catch (error: any) {
        Alert.alert(
          "Payment Failed",
          `There was an issue with your payment. ${error.message}`
        );
      }
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

            <View style={styles.orderSummary}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              {items.map((item) => (
                <View key={item.id} style={styles.summaryItem}>
                  <Text style={styles.summaryItemName}>
                    {item.name}{" "}
                    {item.variation.length ? item.variation[0].value : ""} x{" "}
                    {item.quantity}
                  </Text>
                  {productType === CHECKOUT_PRODUCT_TYPE.WALLET ? (
                    <Text style={styles.summaryItemPrice}>
                      ${(Number(amount) || 0).toFixed(2)}
                    </Text>
                  ) : (
                    <Text style={styles.summaryItemPrice}>
                      $
                      {(
                        (Number(item.prices.price) / 100) *
                        item.quantity
                      ).toFixed(2)}
                    </Text>
                  )}
                </View>
              ))}
              <View style={styles.divider} />
              <View style={styles.summaryItem}>
                <Text style={styles.totalLabel}>Total</Text>
                {productType === CHECKOUT_PRODUCT_TYPE.WALLET ? (
                  <Text style={styles.totalPrice}>
                    ${(Number(amount) || 0).toFixed(2)}
                  </Text>
                ) : (
                  <Text style={styles.totalPrice}>
                    ${(totalPrice / 100).toFixed(2)}
                  </Text>
                )}
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
            <Text style={styles.payButtonText}>
              {status ? "Continue Payment" : "Place an Order"}
            </Text>
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
function addFundsToWallet() {
  throw new Error("Function not implemented.");
}
