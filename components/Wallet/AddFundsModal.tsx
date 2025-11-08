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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Colors from "@/constants/colors";
interface AddFundsModalProps {
  visible: boolean;
  onClose: () => void;
  onAddFunds: (amount: number, paymentMethod: string) => Promise<void>;
}

const PAYMENT_METHODS = [
  { id: CHECKOUT_PAYMENT_METHOD.STRIPE, name: "Credit/Debit Card" },
  { id: CHECKOUT_PAYMENT_METHOD.PAYPAL, name: "PayPal" },
  // { id: 'bank_transfer', name: 'Bank Transfer' },
  // { id: 'crypto', name: 'Cryptocurrency' },
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
      id: 52365, // Flintop Wallet Product ID
      quantity: 1,
    };
    if (cartCount) {
      Alert.alert(
        "Invalid Cart",
        `You cannot purchase wallet with other items in the cart. Please clear your cart and try again.`
      );
    } else {
      // setLoading(true);
      setVisibility(false);
      resetForm();
      addToCart(product as Product).then((data) => {
        console.log("Funds amount:", numericAmount);
        router.push(
          `/checkout?productType=${CHECKOUT_PRODUCT_TYPE.WALLET}&amount=${numericAmount}`
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
    } finally {
      setLoading(false);
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

  const quickAmounts = [10, 25, 50, 100, 200, 500, 1000];

  return (
    <Modal
      visible={visibility}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Funds</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="Enter amount"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              editable={!loading}
            />

            {/* Quick Amount Buttons */}
            <View style={styles.quickAmountsContainer}>
              <Text style={styles.quickAmountsLabel}>Quick Select:</Text>
              <View style={styles.quickAmounts}>
                {quickAmounts.map((quickAmount) => (
                  <TouchableOpacity
                    key={quickAmount}
                    style={[
                      styles.quickAmountButton,
                      amount === quickAmount.toString() &&
                        styles.quickAmountButtonSelected,
                    ]}
                    onPress={() => setAmount(quickAmount.toString())}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.quickAmountText,
                        amount === quickAmount.toString() &&
                          styles.quickAmountTextSelected,
                      ]}
                    >
                      ${quickAmount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Payment Method Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.paymentMethods}>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethod,
                    selectedMethod === method.id &&
                      styles.paymentMethodSelected,
                  ]}
                  onPress={() => setSelectedMethod(method.id)}
                  disabled={loading}
                >
                  <View style={styles.radioContainer}>
                    <View
                      style={[
                        styles.radio,
                        selectedMethod === method.id && styles.radioSelected,
                      ]}
                    />
                  </View>
                  <Text style={styles.paymentMethodText}>{method.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Add Funds Button */}
          <TouchableOpacity
            style={[
              styles.addFundsButton,
              (!amount || !selectedMethod || loading) &&
                styles.addFundsButtonDisabled,
            ]}
            onPress={handleAddFunds}
            disabled={!amount || !selectedMethod || loading}
          >
            <Text style={styles.addFundsButtonText}>
              {loading ? "Processing..." : `Add $${amount || "0.00"}`}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 20,
    color: "#666",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  amountInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  quickAmountsContainer: {
    marginTop: 12,
  },
  quickAmountsLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  quickAmounts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickAmountButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  quickAmountButtonSelected: {
    backgroundColor: Colors.darkGold,
    borderColor: Colors.darkGold,
  },
  quickAmountText: {
    fontSize: 14,
    color: "#333",
  },
  quickAmountTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  paymentMethods: {
    gap: 8,
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  paymentMethodSelected: {
    borderColor: Colors.darkGold,
    backgroundColor: "#e3f2fd",
  },
  radioContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
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
    color: "#333",
  },
  addFundsButton: {
    backgroundColor: Colors.darkGold,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  addFundsButtonDisabled: {
    backgroundColor: "#ccc",
  },
  addFundsButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
