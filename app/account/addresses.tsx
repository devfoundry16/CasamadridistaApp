import HeaderStack from "@/components/HeaderStack";
import Colors from "@/constants/colors";
import { useUser } from "@/hooks/useUser";
import { Address } from "@/types/user/profile";
import { Edit, Trash2, X } from "lucide-react-native";
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

function AddressView({
  address,
  handleEdit,
  handleDelete,
}: {
  address: Address;
  handleEdit: (e: Address) => void;
  handleDelete: (e: Address) => void;
}) {
  return (
    <View style={styles.addressCard}>
      <View style={styles.addressHeader}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{address.type}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(address)}
          >
            <Edit size={18} color={Colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(address)}
          >
            <Trash2 size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      {!address.first_name.length ? (
        <Text style={{ color: Colors.textWhite }}>No Address Found</Text>
      ) : (
        <View>
          <Text style={styles.addressName}>
            {address.first_name} {address.last_name}
          </Text>
          <Text style={styles.addressText}>{address.address_1}</Text>
          <Text style={styles.addressText}>{address.address_2}</Text>
          <Text style={styles.addressText}>
            {address.city}
            {address.city ? "," : ""} {address.country} {address.postcode}
          </Text>
          <Text style={styles.addressText}>{address.phone}</Text>
        </View>
      )}
    </View>
  );
}

export default function AddressesScreen() {
  const { user, updateAddress, deleteAddress } = useUser();
  const billingAddress = { type: "billing", ...user?.billing };
  const shippingAddress = { type: "shipping", ...user?.shipping };
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    type: "shipping" as "shipping" | "billing",
    email: "",
    first_name: "",
    last_name: "",
    company: "",
    address_1: "",
    address_2: "",
    city: "",
    state: "",
    country: "",
    postcode: "",
    phone: "",
  });
  const handleSave = () => {
    if (
      formData.type === "billing" &&
      !formData.email
      //  || (!formData.address_1 && !formData.address_2)
      // || !formData.city
      // || !formData.first_name
      // || !formData.last_name
      // || !formData.country
    ) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    updateAddress(formData);

    setModalVisible(false);
    resetForm();
  };

  const handleEdit = (address: any) => {
    setFormData(address);
    setModalVisible(true);
  };

  const handleDelete = (type: "shipping" | "billing") => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteAddress(type),
        },
      ]
    );
  };

  const resetForm = () => {
    // setFormData({
    //   type: "shipping",
    //   email: "",
    //   first_name: "",
    //   last_name: "",
    //   address: "",
    //   city: "",
    //   country: "",
    //   state: "",
    //   postcode: "",
    //   phone: "",
    // });
  };
  return (
    <>
      <HeaderStack title="Addresses" />
      <ScrollView style={styles.container}>
        {/* <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Plus size={20} color={Colors.textWhite} />
          <Text style={styles.addButtonText}>Add New Address</Text>
        </TouchableOpacity> */}

        {/* {shippingAddress?.first_name == '' && billingAddress?.first_name == '' ? (
          <View style={styles.emptyState}>
            <MapPin size={64} color={Colors.darkGray} />
            <Text style={styles.emptyText}>No addresses saved</Text>
          </View>
        ) : ( */}
        <View style={styles.addressList}>
          {billingAddress && (
            <AddressView
              address={billingAddress as any}
              handleEdit={handleEdit}
              handleDelete={() => handleDelete("billing")}
            />
          )}
          {shippingAddress && (
            <AddressView
              address={shippingAddress as any}
              handleEdit={handleEdit}
              handleDelete={() => handleDelete("shipping")}
            />
          )}
        </View>

        <Modal visible={modalVisible} animationType="slide" transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Address</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={24} color={Colors.textWhite} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.form}>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      formData.type === "shipping" && styles.typeOptionActive,
                    ]}
                    // onPress={() =>
                    //   setFormData({ ...formData, type: "shipping" })
                    // }
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        formData.type === "shipping" &&
                          styles.typeOptionTextActive,
                      ]}
                    >
                      Shipping
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      formData.type === "billing" && styles.typeOptionActive,
                    ]}
                    // onPress={() =>
                    //   setFormData({ ...formData, type: "billing" })
                    // }
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        formData.type === "billing" &&
                          styles.typeOptionTextActive,
                      ]}
                    >
                      Billing
                    </Text>
                  </TouchableOpacity>
                </View>
                {formData.type === "billing" && (
                  <TextInput
                    style={styles.input}
                    value={formData.email}
                    onChangeText={(text) =>
                      setFormData({ ...formData, email: text })
                    }
                    placeholder="Email *"
                    placeholderTextColor={Colors.textLight}
                    autoCapitalize="none"
                  />
                )}
                <TextInput
                  style={styles.input}
                  value={formData.first_name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, first_name: text })
                  }
                  placeholder="First Name *"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  style={styles.input}
                  value={formData.last_name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, last_name: text })
                  }
                  placeholder="Last Name *"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  style={styles.input}
                  value={formData.company}
                  onChangeText={(text) =>
                    setFormData({ ...formData, company: text })
                  }
                  placeholder="Company"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  style={styles.input}
                  value={formData.address_1}
                  onChangeText={(text) =>
                    setFormData({ ...formData, address_1: text })
                  }
                  placeholder="Address 1"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  style={styles.input}
                  value={formData.address_2}
                  onChangeText={(text) =>
                    setFormData({ ...formData, address_2: text })
                  }
                  placeholder="Address 2"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  style={styles.input}
                  value={formData.city}
                  onChangeText={(text) =>
                    setFormData({ ...formData, city: text })
                  }
                  placeholder="Town / City *"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  style={styles.input}
                  value={formData.country}
                  onChangeText={(text) =>
                    setFormData({ ...formData, country: text })
                  }
                  placeholder="Country"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  style={styles.input}
                  value={formData.state}
                  onChangeText={(text) =>
                    setFormData({ ...formData, state: text })
                  }
                  placeholder="State / Country"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  style={styles.input}
                  value={formData.postcode}
                  onChangeText={(text) =>
                    setFormData({ ...formData, postcode: text })
                  }
                  placeholder="Postcode / ZIP"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(text) =>
                    setFormData({ ...formData, phone: text })
                  }
                  placeholder="Phone"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="phone-pad"
                />

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Save Address</Text>
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
  addressList: {
    padding: 24,
    paddingTop: 0,
  },
  addressCard: {
    backgroundColor: "#3A3A3A",
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#4A4A4A",
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  typeBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#1A1A1A",
    textTransform: "capitalize" as const,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
  },
  addressName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: "#CCCCCC",
    marginBottom: 4,
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
    maxHeight: "90%",
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
