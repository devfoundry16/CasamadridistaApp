import HeaderStack from "@/components/HeaderStack";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { useStripePay } from "@/hooks/useStripePay";
import { OrderService } from "@/services/Shop/OrderService";
import { OrderStatus } from "@/types/user/order";
import { CheckCircle, CreditCard, MapPin, User } from "lucide-react-native";
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
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const billingAddress = user?.billing;
  const shippingAddress = user?.shipping;
  const [name, setName] = useState(user?.name);
  const [email, setEmail] = useState(user?.email);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState(shippingAddress);
  const { handlePayment: payWithStripe } = useStripePay();

  const handlePayment = async () => {
    if (!name || !email || !address) {
      Alert.alert(
        "Missing Information",
        "Please fill in all fields to complete your purchase."
      );
      return;
    }
    clearCart();
  };

  const handlePlaceOrder = () => {
    //create an order
    const line_items = items.map((item) => {
      return {
        productId: item.id,
        quantity: item.quantity,
      };
    });
    OrderService.createOrder(line_items).then((data) => {
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
      payWithStripe(data.id)
        .then((intent) => {
          OrderService.updateOrder(data.id, {
            payment_method: "stripe",
            payment_method_title: "Stripe",
            set_paid: true,
            status: OrderStatus.PROCESSING,
            meta_data: [{ key: "_stripe_payment_intent", value: intent.id }],
          }).then(() => {
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
    });
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
                value={
                  address?.address_1 +
                  " " +
                  address?.city +
                  " " +
                  address?.state +
                  " " +
                  address?.postcode
                }
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
                    $
                    {(
                      (Number(item.prices.price) / 100) *
                      item.quantity
                    ).toFixed(2)}
                  </Text>
                </View>
              ))}
              <View style={styles.divider} />
              <View style={styles.summaryItem}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalPrice}>
                  ${(totalPrice / 100).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.payButton}
            onPress={handlePlaceOrder}
            activeOpacity={0.8}
          >
            <CheckCircle size={20} color={Colors.darkBg} />
            <Text style={styles.payButtonText}>Place an Order</Text>
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
