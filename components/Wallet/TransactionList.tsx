// components/TransactionList.tsx
import { WalletTransaction } from "@/services/WalletService";
import { formatDate } from "@/utils/helper";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/Text";
import { FlatList, View } from "react-native";

interface TransactionListProps {
  transactions: WalletTransaction[];
  currency?: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  currency = "$",
}) => {
  const { t } = useTranslation();
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
    item: WalletTransaction;
  }) => (
    <View className="flex-row items-start py-3">
      <View className="w-10 h-10 rounded-full bg-bg-light justify-center items-center mr-3">
        <Text className="text-base">{getTransactionIcon(item.type)}</Text>
      </View>

      <View className="flex-1 mr-3">
        <Text className="text-base font-medium text-text-primary mb-1 leading-5" numberOfLines={2}>
          {item.description ||
            (item.type === "credit"
              ? t("wallet.transactionTopUp")
              : t("wallet.transactionPayment"))}
        </Text>
        <Text className="text-xs text-text-secondary mb-0.5">
          {formatDate(item.created_at)}
        </Text>
        <Text className="text-[11px] text-text-tertiary italic">
          {item.payment_method}
        </Text>
        {item.stripe_payment_intent_id && (
          <Text className="text-[11px] text-text-tertiary italic">
            {t("wallet.transactionId")}: {item.stripe_payment_intent_id.substring(0, 20)}...
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
        <Text className="text-[11px] text-text-secondary capitalize">
          {item.payment_method}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View className="items-center py-10 px-5">
      <Text className="text-5xl mb-4">💳</Text>
      <Text className="text-lg font-bold text-text-secondary mb-2 text-center">
        {t("wallet.noTransactionsTitle")}
      </Text>
      <Text className="text-sm text-text-tertiary text-center leading-5">
        {t("wallet.noTransactionsBody")}
      </Text>
    </View>
  );

  return (
    <View className="bg-bg-card mx-4 mb-4 rounded-xl p-4 shadow-md">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-text-primary">
          {t("wallet.recentTransactions")}
        </Text>
        <Text className="text-xs text-text-secondary bg-bg-light px-2 py-1 rounded-xl">
          {transactions.length}{" "}
          {transactions.length === 1
            ? t("wallet.transactionSingular")
            : t("wallet.transactionPlural")}
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
