// components/TransferModal.tsx
import { Text } from "@/components/Text";
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from "react-i18next";

interface TransferModalProps {
  visible: boolean;
  onClose: () => void;
  onTransfer: (recipientEmail: string, amount: number, message?: string) => Promise<void>;
  currentBalance: number;
  currency: string;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  visible,
  onClose,
  onTransfer,
  currentBalance,
  currency,
}) => {
  const { t } = useTranslation();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    if (!recipientEmail || !amount) {
      Alert.alert(t("common.error"), t("wallet.transferEnterRecipientAndAmount"));
      return;
    }

    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert(t("common.error"), t("wallet.transferInvalidAmount"));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      Alert.alert(t("common.error"), t("membership.invalidEmail"));
      return;
    }

    if (numericAmount > currentBalance) {
      Alert.alert(t("common.error"), t("wallet.insufficientBalance"));
      return;
    }

    try {
      setLoading(true);
      await onTransfer(recipientEmail, numericAmount, message);
      resetForm();
    } catch (error) {
      // Error is handled in the parent component
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRecipientEmail('');
    setAmount('');
    setMessage('');
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-bg-medium">
        <View className="flex-row justify-between items-center p-4 border-b border-border-default">
          <Text className="text-lg font-bold text-text-primary">{t("wallet.transferFunds")}</Text>
          <TouchableOpacity
            onPress={handleClose}
            className="w-[30px] h-[30px] rounded-full bg-bg-light justify-center items-center"
          >
            <Text className="text-xl text-text-secondary">×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 p-4">
          <View className="bg-bg-card p-4 rounded-lg items-center mb-6">
            <Text className="text-sm text-text-secondary mb-1">{t("wallet.availableBalance")}</Text>
            <Text className="text-xl font-bold text-text-primary">
              {currency}{currentBalance.toFixed(2)}
            </Text>
          </View>

          <View className="mb-5">
            <Text className="text-base font-semibold mb-2 text-text-primary">{t("wallet.recipientEmail")}</Text>
            <TextInput
              className="border border-border-default rounded-lg p-3 text-base bg-bg-card text-text-primary"
              placeholder={t("wallet.placeholderRecipientEmail")}
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={recipientEmail}
              onChangeText={setRecipientEmail}
              editable={!loading}
            />
          </View>

          <View className="mb-5">
            <Text className="text-base font-semibold mb-2 text-text-primary">{t("wallet.amount")}</Text>
            <TextInput
              className="border border-border-default rounded-lg p-3 text-base bg-bg-card text-text-primary"
              placeholder={t("wallet.placeholderAmount")}
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              editable={!loading}
            />
          </View>

          <View className="mb-5">
            <Text className="text-base font-semibold mb-2 text-text-primary">{t("wallet.messageOptional")}</Text>
            <TextInput
              className="border border-border-default rounded-lg p-3 text-base bg-bg-card text-text-primary min-h-[80px]"
              placeholder={t("wallet.placeholderNote")}
              placeholderTextColor="#999"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={3}
              editable={!loading}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            className={`p-4 rounded-lg items-center mt-5 ${
              !recipientEmail || !amount || loading
                ? "bg-bg-gray opacity-60"
                : "bg-rm-gold"
            }`}
            onPress={handleTransfer}
            disabled={!recipientEmail || !amount || loading}
          >
            <Text className="text-white text-base font-semibold">
              {loading
                ? t("wallet.processing")
                : t("wallet.transferCta", { amount: `${currency}${amount || "0.00"}` })}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};
