// components/TransferModal.tsx
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface TransferModalProps {
  visible: boolean;
  onClose: () => void;
  onTransfer: (toUserId: number, amount: number, description?: string) => Promise<void>;
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
  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    if (!toUserId || !amount) {
      Alert.alert('Error', 'Please enter user ID and amount');
      return;
    }

    const numericAmount = parseFloat(amount);
    const numericToUserId = parseInt(toUserId, 10);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (isNaN(numericToUserId) || numericToUserId <= 0) {
      Alert.alert('Error', 'Please enter a valid user ID');
      return;
    }

    if (numericAmount > currentBalance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    try {
      setLoading(true);
      await onTransfer(numericToUserId, numericAmount, description);
      resetForm();
    } catch (error) {
      // Error is handled in the parent component
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setToUserId('');
    setAmount('');
    setDescription('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Transfer Funds</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>
              {currency}{currentBalance.toFixed(2)}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>To User ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter user ID"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              value={toUserId}
              onChangeText={setToUserId}
              editable={!loading}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              editable={!loading}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add a note for this transfer"
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.transferButton,
              (!toUserId || !amount || loading) && styles.transferButtonDisabled,
            ]}
            onPress={handleTransfer}
            disabled={!toUserId || !amount || loading}
          >
            <Text style={styles.transferButtonText}>
              {loading ? 'Processing...' : `Transfer ${currency}${amount || '0.00'}`}
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  balanceInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  transferButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  transferButtonDisabled: {
    backgroundColor: '#ccc',
  },
  transferButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});