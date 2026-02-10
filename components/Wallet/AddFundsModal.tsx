// components/AddFundsModal.tsx
import { useCart } from "@/hooks/useCart";
import {
  CHECKOUT_PAYMENT_METHOD,
  CHECKOUT_PRODUCT_TYPE,
} from "@/types/shop/checkout";
import { Product } from "@/types/shop/product";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Colors from "@/constants/colors";
import { Spinner } from "../Spinner";
interface AddFundsModalProps {
  visible: boolean;
  onClose: () => void;
  onAddFunds: (amount: number, paymentMethod: string) => Promise<void>;
}

const PAYMENT_METHODS = [
  { id: CHECKOUT_PAYMENT_METHOD.STRIPE, name: "Credit/Debit Card" },
  { id: CHECKOUT_PAYMENT_METHOD.PAYPAL, name: "PayPal" },
];

export const AddFundsModal: React.FC<AddFundsModalProps> = ({
  visible,
  onClose,
  onAddFunds,
}) => {
  const [amount, setAmount] = useState("");
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const { addToCart, items } = useCart();
  const cartCount = items.length;
  const [loading, setLoading] = useState(false);
  const [visibility, setVisibility] = useState(visible);

  useEffect(() => {
    setVisibility(visible);
  }, [visible]);

  const handleWallet = async (numericAmount: number) => {
    const product = {
      id: 52365,
      quantity: 1,
    };
    if (cartCount) {
      Alert.alert(
        "Invalid Cart",
        `You cannot purchase wallet with other items in the cart. Please clear your cart and try again.`
      );
    } else {
      setLoading(true);
      setVisibility(false);
      resetForm();
      addToCart(product as Product)
        .then((data) => {
          router.dismissAll();
          setLoading(false);
          router.navigate(
            `/checkout?productType=${CHECKOUT_PRODUCT_TYPE.WALLET}&amount=${numericAmount}&payment_method=${selectedMethod}`
          );
        })
        .catch((error) => {
          setLoading(false);
          Alert.alert(
            "Error",
            "Failed to add funds to cart. Please try again."
          );
        });
    }
  };
  const handleAddFunds = async () => {
    if (!amount || !selectedMethod) {
      Alert.alert("Error", "Please enter amount and select payment method");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (numericAmount < 1) {
      Alert.alert("Error", "Minimum amount is $1.00");
      return;
    }

    try {
      handleWallet(numericAmount);
    } catch (error) {
      // Error is handled in the parent component
    }
  };

  const resetForm = () => {
    setAmount("");
    setSelectedMethod("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-bg-medium justify-center items-center">
        <Text className="text-base font-semibold text-text-primary mb-3">
          Processing...
        </Text>
      </View>
    );
  }

  const quickAmounts = [10, 25, 50, 100, 200, 500, 1000];

  return (
    <Modal
      visible={visibility}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-bg-medium">
        <View className="flex-row justify-between items-center p-4 border-b border-border-default">
          <Text className="text-lg font-bold text-text-primary">Add Funds</Text>
          <TouchableOpacity
            onPress={handleClose}
            className="w-[30px] h-[30px] rounded-full bg-bg-light justify-center items-center"
          >
            <Text className="text-xl text-text-secondary">×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Amount Input */}
          <View className="mb-6">
            <Text className="text-base font-semibold mb-3 text-text-primary">
              Amount
            </Text>
            <TextInput
              className="border border-border-default rounded-lg p-3 text-base bg-bg-card text-text-primary"
              placeholder="Enter amount"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              editable={!loading}
            />

            {/* Quick Amount Buttons */}
            <View className="mt-3">
              <Text className="text-sm text-text-secondary mb-2">
                Quick Select:
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {quickAmounts.map((quickAmount) => {
                  const isSelected = amount === quickAmount.toString();
                  return (
                    <TouchableOpacity
                      key={quickAmount}
                      className={`px-4 py-2 rounded-full border ${
                        isSelected
                          ? "bg-rm-gold border-rm-gold"
                          : "bg-bg-light border-border-default"
                      }`}
                      onPress={() => setAmount(quickAmount.toString())}
                      disabled={loading}
                    >
                      <Text
                        className={`text-sm ${
                          isSelected
                            ? "text-white font-semibold"
                            : "text-text-primary"
                        }`}
                      >
                        ${quickAmount}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Payment Method Selection */}
          <View className="mb-6">
            <Text className="text-base font-semibold mb-3 text-text-primary">
              Payment Method
            </Text>
            <View className="gap-2">
              {PAYMENT_METHODS.map((method) => {
                const isSelected = selectedMethod === method.id;
                return (
                  <TouchableOpacity
                    key={method.id}
                    className={`flex-row items-center p-3 rounded-lg border ${
                      isSelected
                        ? "border-rm-gold bg-rm-gold/20"
                        : "border-border-default bg-bg-card"
                    }`}
                    onPress={() => setSelectedMethod(method.id)}
                    disabled={loading}
                  >
                    <View
                      className={`w-5 h-5 rounded-full border-2 mr-3 justify-center items-center ${
                        isSelected ? "border-rm-gold" : "border-border-light"
                      }`}
                    >
                      {isSelected && (
                        <View className="w-2.5 h-2.5 rounded-full bg-rm-gold" />
                      )}
                    </View>
                    <Text className="text-base text-text-primary">
                      {method.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Add Funds Button */}
          <TouchableOpacity
            className={`p-4 rounded-lg items-center mt-5 ${
              !amount || !selectedMethod || loading
                ? "bg-bg-gray opacity-60"
                : "bg-rm-gold"
            }`}
            onPress={handleAddFunds}
            disabled={!amount || !selectedMethod || loading}
          >
            <Text className="text-white text-base font-semibold">
              {loading ? "Processing..." : `Add $${amount || "0.00"}`}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};
