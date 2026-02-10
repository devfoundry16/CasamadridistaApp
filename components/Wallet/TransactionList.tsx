// components/TransactionList.tsx
import { FlintopWalletTransaction } from "@/types/user/flintop-wallet";
import { formatDate } from "@/utils/helper";
import React from "react";
import { FlatList, Text, View } from "react-native";

interface TransactionListProps {
  transactions: FlintopWalletTransaction[];
  currency?: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  currency = "$",
}) => {
  const getTransactionIcon = (type: "credit" | "debit"): string => {
    return type === "credit" ? "⬆️" : "⬇️";
  };

  const getAmountColor = (type: "credit" | "debit"): string => {
    return type === "credit" ? "#4CAF50" : "#F44336";
  };

  const getAmountPrefix = (type: "credit" | "debit"): string => {
    return type === "credit" ? "+" : "-";
  };

  const renderTransactionItem = ({
    item,
  }: {
    item: FlintopWalletTransaction;
  }) => (
    <View className="flex-row items-start py-3">
      <View className="w-10 h-10 rounded-full bg-bg-light justify-center items-center mr-3">
        <Text className="text-base">{getTransactionIcon(item.type)}</Text>
      </View>

      <View className="flex-1 mr-3">
        <Text className="text-base font-medium text-text-primary mb-1 leading-5" numberOfLines={2}>
          {item.details}
        </Text>
        <Text className="text-xs text-text-secondary mb-0.5">
          {formatDate(item.date)}
        </Text>
        {item.order_id && (
          <Text className="text-[11px] text-text-tertiary italic">
            Order #: {item.order_id}
          </Text>
        )}
        {item.transaction_id && (
          <Text className="text-[11px] text-text-tertiary italic">
            Transaction #: {item.transaction_id}
          </Text>
        )}
      </View>

      <View className="items-end">
        <Text
          className="text-base font-bold mb-0.5"
          style={{ color: getAmountColor(item.type) }}
        >
          {getAmountPrefix(item.type)}
          {currency}
          {Math.abs(item.amount).toFixed(2)}
        </Text>
        <Text className="text-[11px] text-text-secondary">
          Balance: {currency}
          {item.balance.toFixed(2)}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View className="items-center py-10 px-5">
      <Text className="text-5xl mb-4">💳</Text>
      <Text className="text-lg font-bold text-text-secondary mb-2 text-center">
        No Transactions Yet
      </Text>
      <Text className="text-sm text-text-tertiary text-center leading-5">
        Your wallet transactions will appear here once you start using your
        balance.
      </Text>
    </View>
  );

  return (
    <View className="bg-bg-card mx-4 mb-4 rounded-xl p-4 shadow-md">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-text-primary">
          Recent Transactions
        </Text>
        <Text className="text-xs text-text-secondary bg-bg-light px-2 py-1 rounded-xl">
          {transactions.length}{" "}
          {transactions.length === 1 ? "transaction" : "transactions"}
        </Text>
      </View>

      {transactions.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => (
            <View className="h-px bg-border-default my-1" />
          )}
        />
      )}
    </View>
  );
};
