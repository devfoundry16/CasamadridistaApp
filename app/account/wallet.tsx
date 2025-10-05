import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';

export default function WalletScreen() {
  const { wallet, updateWallet } = useAuth();
  const [amount, setAmount] = useState('');

  const handleAddFunds = () => {
    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    updateWallet(value);
    setAmount('');
    Alert.alert('Success', `$${value.toFixed(2)} added to your wallet`);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Wallet',
          headerStyle: { backgroundColor: Colors.secondary },
          headerTintColor: Colors.textWhite,
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.balanceCard}>
          <Wallet size={48} color={Colors.accent} />
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>${wallet.toFixed(2)}</Text>
        </View>

        <View style={styles.addFundsSection}>
          <Text style={styles.sectionTitle}>Add Funds</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={Colors.darkGray}
              keyboardType="decimal-pad"
            />
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddFunds}>
            <Plus size={20} color={Colors.textWhite} />
            <Text style={styles.addButtonText}>Add Funds</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <View style={styles.transactionItem}>
            <View style={styles.transactionIcon}>
              <ArrowUpRight size={20} color={Colors.success} />
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionTitle}>Added Funds</Text>
              <Text style={styles.transactionDate}>Jan 15, 2025</Text>
            </View>
            <Text style={styles.transactionAmount}>+$100.00</Text>
          </View>
          <View style={styles.transactionItem}>
            <View style={styles.transactionIcon}>
              <ArrowDownLeft size={20} color={Colors.error} />
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionTitle}>Membership Purchase</Text>
              <Text style={styles.transactionDate}>Jan 10, 2025</Text>
            </View>
            <Text style={[styles.transactionAmount, styles.negativeAmount]}>-$50.00</Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2A2A2A',
  },
  balanceCard: {
    margin: 24,
    padding: 32,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#CCCCCC',
    marginTop: 16,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  addFundsSection: {
    margin: 24,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.textWhite,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A3A3A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A4A4A',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.accent,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600' as const,
    color: Colors.textWhite,
    paddingVertical: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 25,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textWhite,
  },
  transactionsSection: {
    margin: 24,
    marginTop: 0,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A3A3A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textWhite,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  negativeAmount: {
    color: Colors.error,
  },
});
