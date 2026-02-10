// components/TransferModal.tsx
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
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
      <View className="flex-1 bg-bg-medium">
        <View className="flex-row justify-between items-center p-4 border-b border-border-default">
          <Text className="text-lg font-bold text-text-primary">Transfer Funds</Text>
          <TouchableOpacity
            onPress={handleClose}
            className="w-[30px] h-[30px] rounded-full bg-bg-light justify-center items-center"
          >
            <Text className="text-xl text-text-secondary">×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 p-4">
          <View className="bg-bg-card p-4 rounded-lg items-center mb-6">
            <Text className="text-sm text-text-secondary mb-1">Available Balance</Text>
            <Text className="text-xl font-bold text-text-primary">
              {currency}{currentBalance.toFixed(2)}
            </Text>
          </View>

          <View className="mb-5">
            <Text className="text-base font-semibold mb-2 text-text-primary">To User ID</Text>
            <TextInput
              className="border border-border-default rounded-lg p-3 text-base bg-bg-card text-text-primary"
              placeholder="Enter user ID"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              value={toUserId}
              onChangeText={setToUserId}
              editable={!loading}
            />
          </View>

          <View className="mb-5">
            <Text className="text-base font-semibold mb-2 text-text-primary">Amount</Text>
            <TextInput
              className="border border-border-default rounded-lg p-3 text-base bg-bg-card text-text-primary"
              placeholder="Enter amount"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              editable={!loading}
            />
          </View>

          <View className="mb-5">
            <Text className="text-base font-semibold mb-2 text-text-primary">Description (Optional)</Text>
            <TextInput
              className="border border-border-default rounded-lg p-3 text-base bg-bg-card text-text-primary min-h-[80px]"
              placeholder="Add a note for this transfer"
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              editable={!loading}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            className={`p-4 rounded-lg items-center mt-5 ${
              !toUserId || !amount || loading
                ? "bg-bg-gray opacity-60"
                : "bg-rm-gold"
            }`}
            onPress={handleTransfer}
            disabled={!toUserId || !amount || loading}
          >
            <Text className="text-white text-base font-semibold">
              {loading ? 'Processing...' : `Transfer ${currency}${amount || '0.00'}`}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};
