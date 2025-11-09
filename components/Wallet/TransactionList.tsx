// components/TransactionList.tsx
import { FlintopWalletTransaction } from "@/types/user/flintop-wallet";
import { formatDate } from "@/utils/helper";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

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
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Text style={styles.iconText}>{getTransactionIcon(item.type)}</Text>
      </View>

      <View style={styles.transactionDetails}>
        <Text style={styles.transactionDescription} numberOfLines={2}>
          {item.details}
        </Text>
        <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
        {item.order_id && (
          <Text style={styles.orderId}>Order #: {item.order_id}</Text>
        )}
        {item.transaction_id && (
          <Text style={styles.orderId}>
            Transaction #: {item.transaction_id}
          </Text>
        )}
      </View>

      <View style={styles.amountContainer}>
        <Text
          style={[
            styles.transactionAmount,
            { color: getAmountColor(item.type) },
          ]}
        >
          {getAmountPrefix(item.type)}
          {currency}
          {Math.abs(item.amount).toFixed(2)}
        </Text>
        <Text style={styles.balanceAfter}>
          Balance: {currency}
          {item.balance.toFixed(2)}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>💳</Text>
      <Text style={styles.emptyStateTitle}>No Transactions Yet</Text>
      <Text style={styles.emptyStateText}>
        Your wallet transactions will appear here once you start using your
        balance.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <Text style={styles.transactionCount}>
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
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  transactionCount: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconText: {
    fontSize: 16,
  },
  transactionDetails: {
    flex: 1,
    marginRight: 12,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
    lineHeight: 20,
  },
  transactionDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  orderId: {
    fontSize: 11,
    color: "#888",
    fontStyle: "italic",
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  balanceAfter: {
    fontSize: 11,
    color: "#666",
  },
  separator: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },
});
