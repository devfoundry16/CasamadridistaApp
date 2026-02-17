// components/WalletScreen.tsx
import { Button } from "@/components/Button";
import { useWallet } from "@/hooks/useWallet";
import React, { useState } from "react";
import { Text } from "@/components/Text";
import {
  Alert,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { Spinner } from "../Spinner";
import { AddFundsModal } from "./AddFundsModal";
import { TransactionList } from "./TransactionList";
import { TransferModal } from "./TransferModal";
import { useTranslation } from "react-i18next";

export const WalletScreenDetail: React.FC = () => {
  const { t } = useTranslation();
  const {
    wallet,
    transactions,
    isLoading,
    error,
    loadWallet,
    loadTransactions,
    transferFunds,
  } = useWallet();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadWallet(), loadTransactions()]);
    setRefreshing(false);
  };

  const handleAddFunds = async () => {
    setShowAddFundsModal(false);
    await onRefresh();
  };

  const handleTransfer = async (
    recipientEmail: string,
    amount: number,
    message?: string
  ) => {
    try {
      await transferFunds(recipientEmail, amount, message);
      setShowTransferModal(false);
      await onRefresh();
      Alert.alert(t("common.success"), t("wallet.transferCompleted"));
    } catch (err: any) {
      Alert.alert(t("common.error"), err.message || t("wallet.transferFailed"));
    }
  };

  if (isLoading && !refreshing && !wallet) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-medium">
        <Spinner content={t("wallet.loadingWallet")} />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-medium">
        <Text className="text-status-error text-center mb-4">{t("common.error")}: {error}</Text>
        <Button title={t("wallet.retry")} onPress={onRefresh} />
      </View>
    );
  }

  const balance = wallet?.balance || 0;
  const currency = wallet?.currency || "USD";

  return (
    <View className="flex-1 bg-bg-medium">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Balance Card */}
        <View className="bg-bg-card m-4 p-5 rounded-xl items-center shadow-md">
          <Text className="text-base text-text-secondary mb-2">
            {t("wallet.balance")}
          </Text>
          <Text className="text-3xl font-bold text-text-primary mb-1">
            ${balance.toFixed(2)}
          </Text>
          <Text className="text-sm text-text-secondary">
            {t("wallet.availableBalance")} · {currency}
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row px-4 mb-4 gap-3">
          <Button
            title={t("wallet.addFunds")}
            onPress={() => setShowAddFundsModal(true)}
            variant="primary"
            style={{ flex: 1 }}
          />
          <Button
            title={t("wallet.transfer")}
            onPress={() => setShowTransferModal(true)}
            variant="secondary"
            style={{ flex: 1 }}
          />
        </View>

        {/* Transactions */}
        <TransactionList
          transactions={transactions}
          currency="$"
        />
      </ScrollView>

      {/* Modals */}
      <AddFundsModal
        visible={showAddFundsModal}
        onClose={() => setShowAddFundsModal(false)}
        onSuccess={handleAddFunds}
      />

      <TransferModal
        visible={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onTransfer={handleTransfer}
        currentBalance={balance}
        currency="$"
      />
    </View>
  );
};
