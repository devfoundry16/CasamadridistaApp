// components/WooWalletScreen.tsx
import { Button } from "@/components/Button";
import { useFlintopWallet } from "@/hooks/useFlintopWallet";
import React, { useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Spinner } from "../Spinner";
import { AddFundsModal } from "./AddFundsModal";
import { TransactionList } from "./TransactionList";
import { TransferModal } from "./TransferModal";

export const WalletScreenDetail: React.FC = () => {
  const {
    balance,
    transactions,
    loading,
    error,
    refreshBalance,
    refreshTransactions,
    transferFunds,
  } = useFlintopWallet();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshBalance(), refreshTransactions()]);
    setRefreshing(false);
  };

  const handleAddFunds = async (amount: number, paymentMethod: string) => {
    try {
      setShowAddFundsModal(false);
      Alert.alert("Success", "Funds added successfully!");
    } catch (err) {
      Alert.alert("Error", "Failed to add funds. Please try again.");
    }
  };

  const handleTransfer = async (
    toUserId: number,
    amount: number,
    description?: string
  ) => {
    try {
      await transferFunds(toUserId, amount, description);
      setShowTransferModal(false);
      Alert.alert("Success", "Transfer completed successfully!");
    } catch (err) {
      Alert.alert("Error", "Failed to transfer funds. Please try again.");
    }
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-medium">
        <Spinner content="Loading wallet" />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-medium">
        <Text className="text-status-error text-center mb-4">Error: {error}</Text>
        <Button title="Retry" onPress={onRefresh} />
      </View>
    );
  }

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
            Wallet Balance
          </Text>
          <Text className="text-3xl font-bold text-text-primary mb-1">
            {balance?.formatted_balance || "$0.00"}
          </Text>
          <Text className="text-sm text-text-secondary">
            Available Balance
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row px-4 mb-4 gap-3">
          <Button
            title="Add Funds"
            onPress={() => setShowAddFundsModal(true)}
            variant="primary"
            style={{ flex: 1, height: 32 }}
          />
        </View>

        {/* Transactions */}
        <TransactionList
          transactions={transactions}
          currency={balance?.currency_symbol || "$"}
        />
      </ScrollView>

      {/* Modals */}
      <AddFundsModal
        visible={showAddFundsModal}
        onClose={() => setShowAddFundsModal(false)}
        onAddFunds={handleAddFunds}
      />

      <TransferModal
        visible={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onTransfer={handleTransfer}
        currentBalance={balance?.balance || 0}
        currency={balance?.currency_symbol || "$"}
      />
    </View>
  );
};
