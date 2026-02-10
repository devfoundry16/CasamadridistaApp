import { useUser } from "@/hooks/useUser";
import { CreditCard, Plus, Trash2, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function PaymentMethodsScreen() {
  const { paymentMethods, addPaymentMethod, deletePaymentMethod } = useUser();
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    type: "card" as "card" | "paypal",
    number: "",
    cardHolder: "",
    expiryDate: "",
    cvc: "",
    email: "",
  });

  const handleSave = async () => {
    if (formData.type === "card") {
      if (!formData.number || !formData.cardHolder || !formData.expiryDate) {
        Alert.alert("Error", "Please fill in all card details");
        return;
      }
    } else {
      if (!formData.email) {
        Alert.alert("Error", "Please enter PayPal email");
        return;
      }
    }
    addPaymentMethod({
      id: Date.now().toString(),
      type: formData.type,
      ...(formData.type === "card"
        ? {
            number: formData.number,
            cardHolder: formData.cardHolder,
            expiryDate: formData.expiryDate,
          }
        : { email: formData.email }),
    });
    setModalVisible(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Payment Method",
      "Are you sure you want to delete this payment method?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deletePaymentMethod(id),
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      type: "card",
      number: "",
      cardHolder: "",
      expiryDate: "",
      cvc: "",
      email: "",
    });
  };

  const maskCardNumber = (number: string) => {
    return "**** **** **** " + number.slice(-4);
  };

  return (
    <>
      <ScrollView className="flex-1 bg-bg-medium">
        <TouchableOpacity
          className="flex-row items-center justify-center bg-rm-gold m-6 p-4 rounded-[25px] gap-2"
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text className="text-base font-bold text-white">Add Payment Method</Text>
        </TouchableOpacity>

        {paymentMethods.length === 0 ? (
          <View className="items-center justify-center p-12 mt-12">
            <CreditCard size={64} color="#515151" />
            <Text className="text-lg text-text-secondary mt-4">No payment methods saved</Text>
          </View>
        ) : (
          <View className="p-6 pt-0">
            {paymentMethods.map((method) => (
              <View key={method.id} className="bg-bg-light rounded-2xl p-5 mb-4 border border-border-light">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-[24px] bg-bg-medium justify-center items-center mr-3">
                    <CreditCard size={24} color="#BC9045" />
                  </View>
                  <View className="flex-1">
                    {method.type === "card" ? (
                      <>
                        <Text className="text-base font-bold text-white mb-1">
                          {method.cardHolder}
                        </Text>
                        <Text className="text-sm text-text-secondary mb-0.5">
                          {maskCardNumber(method.number || "")}
                        </Text>
                        <Text className="text-xs text-text-muted">
                          Expires: {method.expiryDate}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text className="text-base font-bold text-white mb-1">PayPal</Text>
                        <Text className="text-sm text-text-secondary">
                          {method.email}
                        </Text>
                      </>
                    )}
                  </View>
                  <TouchableOpacity
                    className="w-10 h-10 rounded-[20px] bg-bg-medium justify-center items-center"
                    onPress={() => handleDelete(method.id)}
                  >
                    <Trash2 size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View className="flex-1 bg-black/80 justify-end">
            <View className="bg-bg-medium rounded-t-3xl max-h-[80%]">
              <View className="flex-row justify-between items-center p-6 border-b border-border-light">
                <Text className="text-xl font-bold text-white">Add Payment Method</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <ScrollView className="p-6">
                <View className="flex-row gap-3 mb-5">
                  <TouchableOpacity
                    className={`flex-1 p-3 rounded-xl border-2 items-center ${
                      formData.type === "card" ? "border-rm-gold bg-rm-gold/20" : "border-border-light"
                    }`}
                    onPress={() => setFormData({ ...formData, type: "card" })}
                  >
                    <Text
                      className={`text-base font-semibold ${
                        formData.type === "card" ? "text-rm-gold" : "text-text-secondary"
                      }`}
                    >
                      Credit Card
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 p-3 rounded-xl border-2 items-center ${
                      formData.type === "paypal" ? "border-rm-gold bg-rm-gold/20" : "border-border-light"
                    }`}
                    onPress={() => setFormData({ ...formData, type: "paypal" })}
                  >
                    <Text
                      className={`text-base font-semibold ${
                        formData.type === "paypal" ? "text-rm-gold" : "text-text-secondary"
                      }`}
                    >
                      PayPal
                    </Text>
                  </TouchableOpacity>
                </View>

                {formData.type === "card" ? (
                  <>
                    <TextInput
                      className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white mb-4"
                      value={formData.number}
                      onChangeText={(text) =>
                        setFormData({ ...formData, number: text })
                      }
                      placeholder="Card Number"
                      placeholderTextColor="#515151"
                      keyboardType="numeric"
                      maxLength={16}
                    />
                    <TextInput
                      className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white mb-4"
                      value={formData.cardHolder}
                      onChangeText={(text) =>
                        setFormData({ ...formData, cardHolder: text })
                      }
                      placeholder="Card Holder Name"
                      placeholderTextColor="#515151"
                    />
                    <View className="flex-row gap-3">
                      <TextInput
                        className="flex-1 bg-bg-light border border-border-light rounded-xl p-4 text-base text-white mb-4"
                        value={formData.expiryDate}
                        onChangeText={(text) =>
                          setFormData({ ...formData, expiryDate: text })
                        }
                        placeholder="MM/YY"
                        placeholderTextColor="#515151"
                        maxLength={5}
                      />
                      <TextInput
                        className="flex-1 bg-bg-light border border-border-light rounded-xl p-4 text-base text-white mb-4"
                        value={formData.cvc}
                        onChangeText={(text) =>
                          setFormData({ ...formData, cvc: text })
                        }
                        placeholder="CVV"
                        placeholderTextColor="#515151"
                        keyboardType="numeric"
                        maxLength={3}
                        secureTextEntry
                      />
                    </View>
                  </>
                ) : (
                  <TextInput
                    className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white mb-4"
                    value={formData.email}
                    onChangeText={(text) =>
                      setFormData({ ...formData, email: text })
                    }
                    placeholder="PayPal Email"
                    placeholderTextColor="#515151"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}

                <TouchableOpacity
                  className="bg-rm-gold p-4 rounded-[25px] items-center mt-2"
                  onPress={handleSave}
                >
                  <Text className="text-base font-bold text-white">Save Payment Method</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </>
  );
}
