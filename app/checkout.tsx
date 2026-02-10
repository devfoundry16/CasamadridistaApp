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
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
} from "react-native";
import { useDispatch } from "react-redux";
import { updateAddress } from "@/store/thunks/userThunks";
import { Spinner } from "@/components/Spinner";

export default function CheckoutScreen() {
  const {
    productType,
    amount,
    pendingOrderId,
    payment_status,
    payment_method,
  } = useLocalSearchParams(); //payment_status for payment status specifically paypal
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
  const [loading, setLoading] = useState<boolean>(false);
  const dispatch = useDispatch();

  const loadSummaryItems = async () => {
    const id = Number(pendingOrderId);
    if (pendingOrderId) {
      const res = await getOrderById(id);
      setSummaryOrder(res);
    }
  };

  useEffect(() => {
    if (payment_status === "success" && pendingOrderId) {
      updateOrder(Number(pendingOrderId), {
        payment_method: CHECKOUT_PAYMENT_METHOD.PAYPAL,
        payment_method_title: "Paypal",
        set_paid: true,
        status: OrderStatus.PROCESSING,
      }).then(() => {
        handleSuccess(Number(pendingOrderId), "PayPal Payment");
      });
    } else {
      loadSummaryItems();
    }
  }, []);

  const getTotalPrice = (): number => {
    if (productType === CHECKOUT_PRODUCT_TYPE.WALLET) return Number(amount);
    if (pendingOrderId) return Number(summaryOrder?.total);
    return totalPrice / 100;
  };

  const getSummary = () => {
    if (productType === CHECKOUT_PRODUCT_TYPE.WALLET) {
      return (
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-sm text-text-secondary flex-1">
            Wallet Top Up
          </Text>
          <Text className="text-sm font-semibold text-white">
            ${Number(amount).toFixed(2)}
          </Text>
        </View>
      );
    }
    if (pendingOrderId) {
      return summaryOrder?.line_items.map((item: any) => (
        <View key={item.id} className="flex-row justify-between items-center mb-3">
          <Text className="text-sm text-text-secondary flex-1">
            {item.name} {item.subtotal} x {item.quantity}
          </Text>
          {productType === CHECKOUT_PRODUCT_TYPE.WALLET ? (
            <Text className="text-sm font-semibold text-white">
              ${(Number(amount) || 0).toFixed(2)}
            </Text>
          ) : (
            <Text className="text-sm font-semibold text-white">
              ${Number(item.total).toFixed(2)}
            </Text>
          )}
        </View>
      ));
    }
    return items.map((item: any) => (
      <View key={item.id} className="flex-row justify-between items-center mb-3">
        <Text className="text-sm text-text-secondary flex-1">
          {item.name} {item.variation.length ? item.variation[0].value : ""} x{" "}
          {item.quantity}
        </Text>
        {productType === CHECKOUT_PRODUCT_TYPE.WALLET ? (
          <Text className="text-sm font-semibold text-white">
            ${(Number(amount) || 0).toFixed(2)}
          </Text>
        ) : (
          <Text className="text-sm font-semibold text-white">
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

  const handleSuccess = async (id: number, status_txt: string) => {
    if (productType === CHECKOUT_PRODUCT_TYPE.SUBSCRIPTION)
      await createSubscription(id);
    else if (productType === CHECKOUT_PRODUCT_TYPE.WALLET)
      await addFundsToWallet(id, status_txt);

    clearCart();
    router.dismissAll();
    setLoading(false);
    router.navigate("/account");
    Alert.alert(
      "Payment Successful",
      "Your payment was processed successfully!"
    );
  };

  const placeOrder = (payload: any) => {
    setLoading(true);
    addOrder(payload)
      .then((data) => {
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
        setLoading(false);
      })
      .catch((error: any) => {
        setLoading(false);
      });
  };

  const createSubscription = async (order_id: number) => {
    setLoading(true);
    createSubscriptionOrder(order_id)
      .then(() => {
        setStatus(false);
        setOrderId(null);
        setLoading(false);
      })
      .catch((error: any) => {
        setLoading(false);
      });
  };

  const addFundsToWallet = async (order_id: number, description: string) => {
    try {
      setLoading(true);
      await addFunds(
        Number(amount),
        order_id,
        payment_method === CHECKOUT_PAYMENT_METHOD.STRIPE
          ? CHECKOUT_PAYMENT_METHOD.STRIPE
          : CHECKOUT_PAYMENT_METHOD.PAYPAL,
        description
      );
      setLoading(false);
    } catch (error: any) {
      Alert.alert("Add Funds Failed", error.message || "Add Funds Error");
      setLoading(false);
    }
  };

  const withDrawFundsFromWallet = async (
    order_id: number,
    description: string
  ) => {
    try {
      setLoading(true);
      const resp = await withdrawFunds(
        totalPrice,
        order_id,
        CHECKOUT_PAYMENT_METHOD.WALLET,
        description
      );
      setLoading(false);
      return resp;
    } catch (error: any) {
      Alert.alert("Withdrawal Failed", error.message || "Withdraw Funds Error");
      setLoading(false);
    }
  };

  const stripePay = () => {
    if (!orderId && !pendingOrderId) return;

    const id = orderId ? orderId : Number(pendingOrderId);

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

    payViaStripe(id, getTotalPrice(), billingPayload)
      .then((res) => {
        setLoading(true);
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
        updateOrder(id, {
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
          await handleSuccess(id, "Stripe Payment");
        });
      })
      .catch((error) => {
        setLoading(false);
        Alert.alert("Payment Failed", error.message);
      });
  };

  const walletPay = () => {
    if (!orderId && !pendingOrderId) return;

    const id = orderId ? orderId : Number(pendingOrderId);

    setLoading(true);
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
        await handleSuccess(id, "Wallet Payment");
      })
      .catch((err: any) => {
        const resp = err?.response || err?.data || null;
        if (
          resp &&
          (resp.code === "insufficient_funds" || resp.status === 400)
        ) {
          const current = resp.current_balance ?? resp.current_balance ?? "N/A";
          const requested =
            resp.requested_amount ?? resp.requested_amount ?? "N/A";
          Alert.alert(
            "Insufficient funds",
            `${resp.message || err.message}\nCurrent balance: $${current}\nRequested amount: $${requested}`
          );
          router.dismissAll();
          setLoading(false);
          router.navigate("/account/wallet");
        } else {
          setLoading(false);
          Alert.alert(
            "Payment Failed",
            err.message || "There was an issue with your payment."
          );
        }
      });
  };

  const paypalPay = () => {
    if (!orderId && !pendingOrderId) return;

    const id = orderId ? orderId : Number(pendingOrderId);
    console.log("navigating to paypal with order id:", id);
    router.navigate(
      `/PayPalScreen?amount=${getTotalPrice()}&orderId=${id}&productType=${productType}`
    );
  };

  const handlePayment = async () => {
    if (!name || !email || !address1 || !city) {
      Alert.alert(
        "Missing Information",
        "Please fill in all fields to complete your purchase."
      );
      return;
    }
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
        if (paymentMethod === CHECKOUT_PAYMENT_METHOD.PAYPAL) {
          paypalPay();
        } else if (paymentMethod === CHECKOUT_PAYMENT_METHOD.STRIPE) {
          stripePay();
        } else {
          walletPay();
        }
      } catch (error: any) {
        Alert.alert(
          "Payment Failed",
          `There was an issue with your payment. ${error.message}`
        );
      }
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-medium">
        <Spinner content={status ? "Processing Payment" : "Placing Order"} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg-medium">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-4">
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-4">
              <User size={20} color="#BC9045" />
              <Text className="text-lg font-bold text-white">
                Personal Information
              </Text>
            </View>
            <TextInput
              className="bg-bg-card border border-border-default rounded-xl p-4 text-base text-white mb-3"
              placeholder="Full Name"
              placeholderTextColor="#A0A0A0"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              className="bg-bg-card border border-border-default rounded-xl p-4 text-base text-white mb-3"
              placeholder="Email Address"
              placeholderTextColor="#A0A0A0"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              className="bg-bg-card border border-border-default rounded-xl p-4 text-base text-white mb-3"
              placeholder="Phone Number"
              placeholderTextColor="#A0A0A0"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <View className="mt-2" />
            <Text className="text-lg font-bold text-white mb-2">
              Billing Address
            </Text>
            <TextInput
              className="bg-bg-card border border-border-default rounded-xl p-4 text-base text-white mb-3"
              placeholder="Address line 1"
              placeholderTextColor="#A0A0A0"
              value={address1}
              onChangeText={setAddress1}
            />
            <TextInput
              className="bg-bg-card border border-border-default rounded-xl p-4 text-base text-white mb-3"
              placeholder="Address line 2 (optional)"
              placeholderTextColor="#A0A0A0"
              value={address2}
              onChangeText={setAddress2}
            />
            <TextInput
              className="bg-bg-card border border-border-default rounded-xl p-4 text-base text-white mb-3"
              placeholder="City"
              placeholderTextColor="#A0A0A0"
              value={city}
              onChangeText={setCity}
            />
            <TextInput
              className="bg-bg-card border border-border-default rounded-xl p-4 text-base text-white mb-3"
              placeholder="State / Region"
              placeholderTextColor="#A0A0A0"
              value={stateField}
              onChangeText={setStateField}
            />
            <TextInput
              className="bg-bg-card border border-border-default rounded-xl p-4 text-base text-white mb-3"
              placeholder="Postal Code"
              placeholderTextColor="#A0A0A0"
              value={postcode}
              onChangeText={setPostcode}
              keyboardType="numeric"
            />
            <TextInput
              className="bg-bg-card border border-border-default rounded-xl p-4 text-base text-white mb-3"
              placeholder="Country"
              placeholderTextColor="#A0A0A0"
              value={country}
              onChangeText={setCountry}
            />
            <View className="flex-row items-center mt-2">
              <Switch
                value={updateBillingChecked}
                onValueChange={setUpdateBillingChecked}
                thumbColor="#BC9045"
                trackColor={{ false: "#0A0A0A", true: "#515151" }}
              />
              <Text className="ml-2 text-white">
                Update account billing address with this information
              </Text>
            </View>
          </View>

          {status === true && (
            <View className="mb-4">
              <Text className="text-lg font-bold text-white mb-4">
                Payment Method
              </Text>
              <View className="gap-2">
                <TouchableOpacity
                  className={`flex-row items-center p-3 border rounded-lg ${
                    paymentMethod === CHECKOUT_PAYMENT_METHOD.STRIPE
                      ? "border-rm-gold bg-bg-card"
                      : "border-border-default"
                  }`}
                  onPress={() =>
                    setPaymentMethod(CHECKOUT_PAYMENT_METHOD.STRIPE)
                  }
                >
                  <View className="w-5 h-5 rounded-full border-2 border-rm-gold justify-center items-center mr-3">
                    <View
                      className={`w-2.5 h-2.5 rounded-full ${
                        paymentMethod === CHECKOUT_PAYMENT_METHOD.STRIPE
                          ? "bg-rm-gold"
                          : "bg-transparent"
                      }`}
                    />
                  </View>
                  <Text className="text-base text-white">
                    Credit/Debit Card
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-row items-center p-3 border rounded-lg ${
                    paymentMethod === CHECKOUT_PAYMENT_METHOD.PAYPAL
                      ? "border-rm-gold bg-bg-card"
                      : "border-border-default"
                  }`}
                  onPress={() =>
                    setPaymentMethod(CHECKOUT_PAYMENT_METHOD.PAYPAL)
                  }
                >
                  <View className="w-5 h-5 rounded-full border-2 border-rm-gold justify-center items-center mr-3">
                    <View
                      className={`w-2.5 h-2.5 rounded-full ${
                        paymentMethod === CHECKOUT_PAYMENT_METHOD.PAYPAL
                          ? "bg-rm-gold"
                          : "bg-transparent"
                      }`}
                    />
                  </View>
                  <Text className="text-base text-white">PayPal</Text>
                </TouchableOpacity>

                {productType !== CHECKOUT_PRODUCT_TYPE.WALLET && (
                  <TouchableOpacity
                    className={`flex-row items-center p-3 border rounded-lg ${
                      paymentMethod === CHECKOUT_PAYMENT_METHOD.WALLET
                        ? "border-rm-gold bg-bg-card"
                        : "border-border-default"
                    }`}
                    onPress={() =>
                      setPaymentMethod(CHECKOUT_PAYMENT_METHOD.WALLET)
                    }
                  >
                    <View className="w-5 h-5 rounded-full border-2 border-rm-gold justify-center items-center mr-3">
                      <View
                        className={`w-2.5 h-2.5 rounded-full ${
                          paymentMethod === CHECKOUT_PAYMENT_METHOD.WALLET
                            ? "bg-rm-gold"
                            : "bg-transparent"
                        }`}
                      />
                    </View>
                    <Text className="text-base text-white">
                      Wallet{" "}
                      {balance
                        ? `(${balance.formatted_balance})`
                        : "(loading...)"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          <View className="bg-bg-card border border-border-default rounded-xl p-4 mb-4">
            <Text className="text-lg font-bold text-white mb-4">
              Order Summary
            </Text>
            <View>{getSummary()}</View>
            <View className="h-px bg-border-default my-3" />
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-white">Total</Text>
              <Text className="text-2xl font-bold text-rm-gold">
                ${getTotalPrice().toFixed(2)}
              </Text>
            </View>
          </View>
          {/* {paymentMethod === CHECKOUT_PAYMENT_METHOD.PAYPAL && (
              <PayPalPaymentScreen
              // orderId={orderId ? orderId : pendingOrderId}
              // amount={getTotalPrice()}
              // productType={productType}
              />
            )} */}
        </View>
      </ScrollView>

      <View className="bg-bg-card p-4 border-t border-border-default">
        <TouchableOpacity
          className="bg-rm-gold py-4 rounded-xl flex-row items-center justify-center gap-2"
          onPress={handlePayment}
          activeOpacity={0.8}
        >
          <CheckCircle size={20} color="#0A0A0A" />
          <Text className="text-lg font-semibold text-bg-dark">
            {status ? "Continue Payment" : "Place an Order"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
