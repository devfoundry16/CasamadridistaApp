// components/AddFundsModal.tsx
import { Text } from "@/components/Text";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useStripePay } from "@/hooks/useStripePay";
import { useWallet } from "@/hooks/useWallet";
import { Spinner } from "../Spinner";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

interface AddFundsModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddFundsModal: React.FC<AddFundsModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { payWithClientSecret } = useStripePay();
  const { createTopUpIntent, confirmTopUp } = useWallet();

  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible]);

  const handleAddFunds = async () => {
    if (!amount) {
      Alert.alert(t("common.error"), t("wallet.enterAmount"));
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert(t("common.error"), t("wallet.invalidAmount"));
      return;
    }

    if (numericAmount < 1) {
      Alert.alert(t("common.error"), t("wallet.minimumAmount"));
      return;
    }

    try {
      setLoading(true);

      // Create Stripe payment intent
      const { clientSecret, paymentIntentId } = await createTopUpIntent(numericAmount, "usd");

      // Process Stripe payment using the same intent created above
      await payWithClientSecret(clientSecret);

      // Confirm top-up after successful payment
      await confirmTopUp(paymentIntentId, numericAmount);

      setLoading(false);
      onSuccess();
      Alert.alert(
        t("common.success"),
        t("wallet.fundsAdded", { amount: numericAmount.toFixed(2) })
      );
    } catch (error: any) {
      setLoading(false);
      Alert.alert(t("common.error"), error.message || t("wallet.addFundsFailed"));
    }
  };

  const resetForm = () => {
    setAmount("");
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const quickAmounts = [10, 25, 50, 100, 200, 500, 1000];

  if (loading) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-bg-medium justify-center items-center">
          <Spinner content={t("wallet.processingPayment")} />
          <Text className="text-base text-text-secondary mt-4">
            {t("wallet.processingPaymentMessage")}
          </Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView className="flex-1 bg-bg-medium">
        <View className="flex-row justify-between items-center p-4 border-b border-border-default">
          <Text className="text-lg font-bold text-text-primary">{t("wallet.addFunds")}</Text>
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
              {t("wallet.amount")}
            </Text>
            <TextInput
              className="border border-border-default rounded-lg p-3 text-base bg-bg-card text-text-primary"
              placeholder={t("wallet.placeholderAmount")}
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              editable={!loading}
            />

            {/* Quick Amount Buttons */}
            <View className="mt-3">
              <Text className="text-sm text-text-secondary mb-2">
                {t("wallet.quickSelect")}
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

          {/* Payment Method Info */}
          <View className="mb-6 p-4 bg-bg-card rounded-lg">
            <Text className="text-sm font-semibold text-text-primary mb-2">
              {t("wallet.paymentMethod")}
            </Text>
            <Text className="text-sm text-text-secondary">
              {t("wallet.paymentViaStripe")}
            </Text>
          </View>

          {/* Add Funds Button */}
          <TouchableOpacity
            className={`p-4 rounded-lg items-center mt-5 ${
              !amount || loading
                ? "bg-bg-gray opacity-60"
                : "bg-rm-gold"
            }`}
            onPress={handleAddFunds}
            disabled={!amount || loading}
          >
            <Text className="text-white text-base font-semibold">
              {loading
                ? t("wallet.processing")
                : t("wallet.addAmountCta", { amount: amount || "0.00" })}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};
