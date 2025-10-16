// components/WooWalletScreen.tsx
import { useFlintopWallet } from '@/hooks/useFlintopWallet';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { AddFundsModal } from './AddFundsModal';
import { Button } from './Button';
import { TransactionList } from './TransactionList';

export const WalletScreenDetail: React.FC = () => {
  const {
    balance,
    transactions,
    loading,
    error,
    refreshBalance,
    refreshTransactions,
    addFunds,
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
      await addFunds(amount, paymentMethod);
      setShowAddFundsModal(false);
      Alert.alert('Success', 'Funds added successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to add funds. Please try again.');
    }
  };

//   const handleTransfer = async (toUserId: number, amount: number, description?: string) => {
//     try {
//       await transferFunds(toUserId, amount, description);
//       setShowTransferModal(false);
//       Alert.alert('Success', 'Transfer completed successfully!');
//     } catch (err) {
//       Alert.alert('Error', 'Failed to transfer funds. Please try again.');
//     }
//   };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#eeeeee" />
        <Text>Loading wallet...</Text>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Button title="Retry" onPress={onRefresh} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Wallet Balance</Text>
          <Text style={styles.balanceAmount}>
            {/* {balance?.formatted_balance || '$0.00'} */}
            ${balance?.balance.toFixed(2)}
          </Text>
          <Text style={styles.balanceSubtitle}>Available Balance</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Add Funds"
            onPress={() => setShowAddFundsModal(true)}
            variant="primary"
            style={styles.actionButton}
          />
          <Button
            title="Transfer"
            onPress={() => setShowTransferModal(true)}
            variant="outline"
            style={styles.actionButton}
          />
        </View>

        {/* Transactions */}
        <TransactionList 
          transactions={transactions} 
          currency={balance?.currency_symbol || '$'}
        />
      </ScrollView>

      {/* Modals */}
      <AddFundsModal
        visible={showAddFundsModal}
        onClose={() => setShowAddFundsModal(false)}
        onAddFunds={handleAddFunds}
      />
      
      {/* <TransferModal
        visible={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onTransfer={handleTransfer}
        currentBalance={balance?.balance || 0}
        currency={balance?.currency_symbol || '$'}
      /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  balanceSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
});