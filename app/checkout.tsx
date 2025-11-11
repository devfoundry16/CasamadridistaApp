import HeaderStack from "@/components/HeaderStack";
import PayPalPaymentScreen from "@/components/PayPalPaymentScreen";
import Colors from "@/constants/colors";
import { useCart } from "@/hooks/useCart";
import { useFlintopWallet } from "@/hooks/useFlintopWallet";
import { useOrder } from "@/hooks/useOrder";
import { useStripePay } from "@/hooks/useStripePay";
import { useUser } from "@/hooks/useUser";
import {
  CHECKOUT_PAYMENT_METHOD,
  CHECKOUT_PRODUCT_TYPE,
} from "@/types/shop/checkout";
import { Order, OrderStatus } from "@/types/shop/order";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle, User } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
} from "react-native";
import { useDispatch } from "react-redux";
import { updateAddress } from "@/store/thunks/userThunks";

export default function CheckoutScreen() {
  const { productType, amount, pendingOrderId } = useLocalSearchParams();
  const { items, totalPrice, clearCart } = useCart();
  const { user, updateCustomer } = useUser();
  const router = useRouter();
  const { addOrder, getOrderById, updateOrder, createSubscriptionOrder } =
    useOrder();
  const billingAddress = user?.billing;
  const [name, setName] = useState(
    billingAddress?.first_name + " " + billingAddress?.last_name
  );
  const [email, setEmail] = useState(
    billingAddress?.email ? billingAddress?.email : user?.email
  );
  const [phone, setPhone] = useState(billingAddress?.phone || "");
  // Billing address form fields (pre-filled from user billing when available)
  const [address1, setAddress1] = useState(billingAddress?.address_1 || "");
  const [address2, setAddress2] = useState(billingAddress?.address_2 || "");
  const [city, setCity] = useState(billingAddress?.city || "");
  const [stateField, setStateField] = useState(billingAddress?.state || "");
  const [country, setCountry] = useState(billingAddress?.country || "");
  const [postcode, setPostcode] = useState(billingAddress?.postcode || "");
  const [updateBillingChecked, setUpdateBillingChecked] = useState(false);
  const [status, setStatus] = useState<boolean>(pendingOrderId ? true : false); //false means place an order, true means paying
  const [orderId, setOrderId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>(
    CHECKOUT_PAYMENT_METHOD.STRIPE
  );
  const [summaryOrder, setSummaryOrder] = useState<Order>();
  const { handlePayment: payViaStripe } = useStripePay();
  const { addFunds, withdrawFunds, balance } = useFlintopWallet();
  const dispatch = useDispatch();

  const loadSummaryItems = async () => {
    const id = Number(pendingOrderId);
    if (pendingOrderId) {
      const res = await getOrderById(id);
      setSummaryOrder(res);
    }
  };

  useEffect(() => {
    loadSummaryItems();
  }, []);

  const getTotalPrice = (): number => {
    if (productType === CHECKOUT_PRODUCT_TYPE.WALLET) return Number(amount);
    if (pendingOrderId) return Number(summaryOrder?.total);
    return totalPrice / 100;
  };

  const getSummary = () => {
    if (productType === CHECKOUT_PRODUCT_TYPE.WALLET) {
      return (
        <View style={styles.summaryItem}>
          <Text style={styles.summaryItemName}>Wallet Top Up</Text>
          {productType === CHECKOUT_PRODUCT_TYPE.WALLET ? (
            <Text style={styles.summaryItemPrice}>
              ${Number(amount).toFixed(2)}
            </Text>
          ) : (
            <Text style={styles.summaryItemPrice}>
              ${Number(amount).toFixed(2)}
            </Text>
          )}
        </View>
      );
    }
    if (pendingOrderId) {
      return summaryOrder?.line_items.map((item: any) => (
        <View key={item.id} style={styles.summaryItem}>
          <Text style={styles.summaryItemName}>
            {item.name} {item.subtotal} x {item.quantity}
          </Text>
          {productType === CHECKOUT_PRODUCT_TYPE.WALLET ? (
            <Text style={styles.summaryItemPrice}>
              ${(Number(amount) || 0).toFixed(2)}
            </Text>
          ) : (
            <Text style={styles.summaryItemPrice}>
              ${Number(item.total).toFixed(2)}
            </Text>
          )}
        </View>
      ));
    }
    return items.map((item: any) => (
      <View key={item.id} style={styles.summaryItem}>
        <Text style={styles.summaryItemName}>
          {item.name} {item.variation.length ? item.variation[0].value : ""} x{" "}
          {item.quantity}
        </Text>
        {productType === CHECKOUT_PRODUCT_TYPE.WALLET ? (
          <Text style={styles.summaryItemPrice}>
            ${(Number(amount) || 0).toFixed(2)}
          </Text>
        ) : (
          <Text style={styles.summaryItemPrice}>
            ${(Number(item.prices.price) / 100).toFixed(2)}
          </Text>
        )}
      </View>
    ));
  };

  const preparePayload = () => {
    const nameParts = name ? name.trim().split(" ") : ["", ""];
    const firstName = nameParts.shift() || "";
    const lastName = nameParts.join(" ") || "";

    const billingPayload = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      address_1: address1,
      address_2: address2,
      city: city,
      state: stateField,
      country: country,
      postcode: postcode,
      type: "billing",
    } as any;

    return {
      payment_method: paymentMethod, // or 'paypal', etc.
      payment_method_title:
        paymentMethod === CHECKOUT_PAYMENT_METHOD.PAYPAL
          ? "PayPal"
          : "Credit/Debit Card",
      set_paid: false, // Let the payment gateway handle the payment
      customer_id: user?.id,
      billing: billingPayload,
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
      // If user opted to update their saved billing address, dispatch updateAddress
      if (updateBillingChecked) {
        const nameParts = name ? name.trim().split(" ") : ["", ""];
        const firstName = nameParts.shift() || "";
        const lastName = nameParts.join(" ") || "";
        const billingPayload = {
          type: "billing",
          email: email,
          first_name: firstName,
          last_name: lastName,
          company: "",
          address_1: address1,
          address_2: address2,
          city: city,
          state: stateField,
          country: country,
          postcode: postcode,
          phone: phone,
        };
        (dispatch as any)(updateAddress(billingPayload as any));
      }
    });
  };

  const createSubscription = async (order_id: number) => {
    console.log("subscription order id: ", order_id);
    createSubscriptionOrder(order_id).then(() => {
      setStatus(false);
      setOrderId(null);
    });
  };

  const addFundsToWallet = async (order_id: number, description: string) => {
    await addFunds(
      Number(amount),
      order_id,
      CHECKOUT_PAYMENT_METHOD.STRIPE,
      description
    );
  };

  const withDrawFundsFromWallet = async (
    order_id: number,
    description: string
  ) => {
    const resp = await withdrawFunds(
      totalPrice,
      order_id,
      CHECKOUT_PAYMENT_METHOD.WALLET,
      description
    );
    return resp;
  };

  const stripePay = () => {
    if (!orderId && !pendingOrderId) return;

    const id = orderId ? orderId : Number(pendingOrderId);

    // Wallet payment branch
    if (paymentMethod === CHECKOUT_PAYMENT_METHOD.WALLET) {
      withDrawFundsFromWallet(
        id,
        productType === CHECKOUT_PRODUCT_TYPE.WALLET
          ? "Wallet Top Up"
          : productType === CHECKOUT_PRODUCT_TYPE.SUBSCRIPTION
            ? "Order Subscription"
            : "Order Standard Product"
      )
        .then(async (res) => {
          // Update order with wallet payment info
          await updateOrder(id, {
            payment_method: CHECKOUT_PAYMENT_METHOD.WALLET,
            payment_method_title: "Wallet",
            set_paid: true,
            status: OrderStatus.PROCESSING,
            meta_data: [
              {
                key: "_wallet_response",
                value: res,
              },
            ],
          });

          if (productType === CHECKOUT_PRODUCT_TYPE.SUBSCRIPTION) {
            await createSubscription(id);
          }

          clearCart();
          router.navigate("/cart");
          Alert.alert(
            `Payment Successful. Current wallet balance: $${res.new_balance}`
          );
        })
        .catch((err: any) => {
          const resp = err?.response || err?.data || null;
          if (
            resp &&
            (resp.code === "insufficient_funds" || resp.status === 400)
          ) {
            const current =
              resp.current_balance ?? resp.current_balance ?? "N/A";
            const requested =
              resp.requested_amount ?? resp.requested_amount ?? "N/A";
            Alert.alert(
              "Insufficient funds",
              `${resp.message || err.message}\nCurrent balance: $${current}\nRequested amount: $${requested}`
            );
            router.navigate("/account/wallet");
          } else {
            Alert.alert(
              "Payment Failed",
              err.message || "There was an issue with your payment."
            );
          }
        });
      return;
    }

    if (paymentMethod !== CHECKOUT_PAYMENT_METHOD.STRIPE) {
      Alert.alert(
        "Payment Method",
        `${paymentMethod} payment flow is not implemented in the app.`
      );
      return;
    }

    const nameParts = name ? name.trim().split(" ") : ["", ""];
    const firstName = nameParts.shift() || "";
    const lastName = nameParts.join(" ") || "";
    const billingPayload = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      address_1: address1,
      address_2: address2,
      city: city,
      state: stateField,
      country: country,
      postcode: postcode,
    } as any;

    payViaStripe(
      orderId ? orderId : Number(pendingOrderId),
      getTotalPrice(),
      billingPayload
    )
      .then((res) => {
        updateCustomer({
          meta_data: [
            {
              key: "stripe_customer_id",
              value: res?.customer,
            },
          ],
        }).then((data) => {
          console.log("======meta data in checkout==========");
        });
        updateOrder(orderId ? orderId : Number(pendingOrderId), {
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
            await createSubscription(
              orderId ? orderId : Number(pendingOrderId)
            );
          else if (productType === CHECKOUT_PRODUCT_TYPE.WALLET)
            await addFundsToWallet(
              orderId ? orderId : Number(pendingOrderId),
              "Wallet Top Up"
            );
          clearCart();
          router.navigate("/cart");
          Alert.alert(
            "Payment Successful",
            "Your payment was processed successfully!"
          );
        });
      })
      .catch((error) => {
        Alert.alert("Payment Failed", error.message);
      });
  };

  const handlePayment = async () => {
    if (!name || !email || !address1 || !city) {
      Alert.alert(
        "Missing Information",
        "Please fill in all fields to complete your purchase."
      );
      return;
    }
    console.log(status);
    if (status === false) {
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
              <View style={{ marginTop: 8 }} />
              <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>
                Billing Address
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Address line 1"
                placeholderTextColor={Colors.textSecondary}
                value={address1}
                onChangeText={setAddress1}
              />
              <TextInput
                style={styles.input}
                placeholder="Address line 2 (optional)"
                placeholderTextColor={Colors.textSecondary}
                value={address2}
                onChangeText={setAddress2}
              />
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor={Colors.textSecondary}
                value={city}
                onChangeText={setCity}
              />
              <TextInput
                style={styles.input}
                placeholder="State / Region"
                placeholderTextColor={Colors.textSecondary}
                value={stateField}
                onChangeText={setStateField}
              />
              <TextInput
                style={styles.input}
                placeholder="Postal Code"
                placeholderTextColor={Colors.textSecondary}
                value={postcode}
                onChangeText={setPostcode}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Country"
                placeholderTextColor={Colors.textSecondary}
                value={country}
                onChangeText={setCountry}
              />
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                <Switch
                  value={updateBillingChecked}
                  onValueChange={setUpdateBillingChecked}
                  thumbColor={Colors.darkGold}
                  trackColor={{ false: Colors.darkBg, true: Colors.darkGray }}
                />
                <Text style={{ marginLeft: 8, color: Colors.textPrimary }}>
                  Update account billing address with this information
                </Text>
              </View>
            </View>

            {status === true && (
              <View style={styles.paymentMethodsContainer}>
                <Text style={styles.summaryTitle}>Payment Method</Text>
                <View style={styles.paymentMethods}>
                  <TouchableOpacity
                    style={[
                      styles.paymentMethod,
                      paymentMethod === CHECKOUT_PAYMENT_METHOD.STRIPE &&
                        styles.paymentMethodSelected,
                    ]}
                    onPress={() =>
                      setPaymentMethod(CHECKOUT_PAYMENT_METHOD.STRIPE)
                    }
                  >
                    <View style={styles.radioContainer}>
                      <View
                        style={[
                          styles.radio,
                          paymentMethod === CHECKOUT_PAYMENT_METHOD.STRIPE &&
                            styles.radioSelected,
                        ]}
                      />
                    </View>
                    <Text style={styles.paymentMethodText}>
                      Credit/Debit Card
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.paymentMethod,
                      paymentMethod === CHECKOUT_PAYMENT_METHOD.PAYPAL &&
                        styles.paymentMethodSelected,
                    ]}
                    onPress={() =>
                      setPaymentMethod(CHECKOUT_PAYMENT_METHOD.PAYPAL)
                    }
                  >
                    <View style={styles.radioContainer}>
                      <View
                        style={[
                          styles.radio,
                          paymentMethod === CHECKOUT_PAYMENT_METHOD.PAYPAL &&
                            styles.radioSelected,
                        ]}
                      />
                    </View>
                    <Text style={styles.paymentMethodText}>PayPal</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.paymentMethod,
                      paymentMethod === CHECKOUT_PAYMENT_METHOD.WALLET &&
                        styles.paymentMethodSelected,
                    ]}
                    onPress={() =>
                      setPaymentMethod(CHECKOUT_PAYMENT_METHOD.WALLET)
                    }
                  >
                    <View style={styles.radioContainer}>
                      <View
                        style={[
                          styles.radio,
                          paymentMethod === CHECKOUT_PAYMENT_METHOD.WALLET &&
                            styles.radioSelected,
                        ]}
                      />
                    </View>
                    <Text style={styles.paymentMethodText}>
                      Wallet{" "}
                      {balance
                        ? `(${balance.formatted_balance})`
                        : "(loading...)"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {paymentMethod === CHECKOUT_PAYMENT_METHOD.PAYPAL && (
              <PayPalPaymentScreen />
            )}
            <View style={styles.orderSummary}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <View>{getSummary()}</View>
              <View style={styles.divider} />
              <View style={styles.summaryItem}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalPrice}>
                  ${getTotalPrice().toFixed(2)}
                </Text>
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
  paymentMethodsContainer: {
    marginBottom: 15,
  },
  paymentMethods: {
    gap: 8,
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
  },
  paymentMethodSelected: {
    borderColor: Colors.darkGold,
    backgroundColor: Colors.cardBg,
  },
  radioContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.darkGold,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  radio: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "transparent",
  },
  radioSelected: {
    backgroundColor: Colors.darkGold,
  },
  paymentMethodText: {
    fontSize: 16,
    color: "#eee",
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
