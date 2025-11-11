import HeaderStack from "@/components/HeaderStack";
import { development } from "@/config/environment";
import Colors from "@/constants/colors";
import { useUser } from "@/hooks/useUser";
import axios from "axios";
import { CreditCard, Plus, Trash2, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
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
      <HeaderStack title="Payment Methods" />
      <ScrollView style={styles.container}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Plus size={20} color={Colors.textWhite} />
          <Text style={styles.addButtonText}>Add Payment Method</Text>
        </TouchableOpacity>

        {paymentMethods.length === 0 ? (
          <View style={styles.emptyState}>
            <CreditCard size={64} color={Colors.darkGray} />
            <Text style={styles.emptyText}>No payment methods saved</Text>
          </View>
        ) : (
          <View style={styles.methodsList}>
            {paymentMethods.map((method) => (
              <View key={method.id} style={styles.methodCard}>
                <View style={styles.methodHeader}>
                  <View style={styles.iconContainer}>
                    <CreditCard size={24} color={Colors.accent} />
                  </View>
                  <View style={styles.methodInfo}>
                    {method.type === "card" ? (
                      <>
                        <Text style={styles.methodTitle}>
                          {method.cardHolder}
                        </Text>
                        <Text style={styles.methodSubtitle}>
                          {maskCardNumber(method.number || "")}
                        </Text>
                        <Text style={styles.methodExpiry}>
                          Expires: {method.expiryDate}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.methodTitle}>PayPal</Text>
                        <Text style={styles.methodSubtitle}>
                          {method.email}
                        </Text>
                      </>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(method.id)}
                  >
                    <Trash2 size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Payment Method</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={24} color={Colors.textWhite} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.form}>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      formData.type === "card" && styles.typeOptionActive,
                    ]}
                    onPress={() => setFormData({ ...formData, type: "card" })}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        formData.type === "card" && styles.typeOptionTextActive,
                      ]}
                    >
                      Credit Card
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      formData.type === "paypal" && styles.typeOptionActive,
                    ]}
                    onPress={() => setFormData({ ...formData, type: "paypal" })}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        formData.type === "paypal" &&
                          styles.typeOptionTextActive,
                      ]}
                    >
                      PayPal
                    </Text>
                  </TouchableOpacity>
                </View>

                {formData.type === "card" ? (
                  <>
                    <TextInput
                      style={styles.input}
                      value={formData.number}
                      onChangeText={(text) =>
                        setFormData({ ...formData, number: text })
                      }
                      placeholder="Card Number"
                      placeholderTextColor={Colors.darkGray}
                      keyboardType="numeric"
                      maxLength={16}
                    />
                    <TextInput
                      style={styles.input}
                      value={formData.cardHolder}
                      onChangeText={(text) =>
                        setFormData({ ...formData, cardHolder: text })
                      }
                      placeholder="Card Holder Name"
                      placeholderTextColor={Colors.darkGray}
                    />
                    <View style={styles.row}>
                      <TextInput
                        style={[styles.input, styles.halfInput]}
                        value={formData.expiryDate}
                        onChangeText={(text) =>
                          setFormData({ ...formData, expiryDate: text })
                        }
                        placeholder="MM/YY"
                        placeholderTextColor={Colors.darkGray}
                        maxLength={5}
                      />
                      <TextInput
                        style={[styles.input, styles.halfInput]}
                        value={formData.cvc}
                        onChangeText={(text) =>
                          setFormData({ ...formData, cvc: text })
                        }
                        placeholder="CVV"
                        placeholderTextColor={Colors.darkGray}
                        keyboardType="numeric"
                        maxLength={3}
                        secureTextEntry
                      />
                    </View>
                  </>
                ) : (
                  <TextInput
                    style={styles.input}
                    value={formData.email}
                    onChangeText={(text) =>
                      setFormData({ ...formData, email: text })
                    }
                    placeholder="PayPal Email"
                    placeholderTextColor={Colors.darkGray}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Save Payment Method</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2A2A2A",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent,
    margin: 24,
    padding: 16,
    borderRadius: 25,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.textWhite,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: "#CCCCCC",
    marginTop: 16,
  },
  methodsList: {
    padding: 24,
    paddingTop: 0,
  },
  methodCard: {
    backgroundColor: "#3A3A3A",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#4A4A4A",
  },
  methodHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    marginBottom: 4,
  },
  methodSubtitle: {
    fontSize: 14,
    color: "#CCCCCC",
    marginBottom: 2,
  },
  methodExpiry: {
    fontSize: 12,
    color: "#999999",
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#2A2A2A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#4A4A4A",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.textWhite,
  },
  form: {
    padding: 24,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  typeOption: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4A4A4A",
    alignItems: "center",
  },
  typeOptionActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + "20",
  },
  typeOptionText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#CCCCCC",
  },
  typeOptionTextActive: {
    color: Colors.accent,
  },
  input: {
    backgroundColor: "#3A3A3A",
    borderWidth: 1,
    borderColor: "#4A4A4A",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.textWhite,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.textWhite,
  },
});
