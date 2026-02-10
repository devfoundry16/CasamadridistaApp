import Colors from "@/constants/colors";
import { useUser } from "@/hooks/useUser";
import { Address } from "@/types/user/profile";
import { Edit, Trash2, X } from "lucide-react-native";
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
    <View className="bg-bg-light rounded-2xl p-5 my-2 border border-border-light">
      <View className="flex-row justify-between items-center mb-3">
        <View className="bg-rm-gold px-3 py-1.5 rounded-xl">
          <Text className="text-xs font-bold text-text-dark capitalize">{address.type}</Text>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="w-9 h-9 rounded-full bg-bg-medium justify-center items-center"
            onPress={() => handleEdit(address)}
          >
            <Edit size={18} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            className="w-9 h-9 rounded-full bg-bg-medium justify-center items-center"
            onPress={() => handleDelete(address)}
          >
            <Trash2 size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      {!address.first_name.length ? (
        <Text className="text-white">No Address Found</Text>
      ) : (
        <View>
          <Text className="text-lg font-bold text-white mb-2">
            {address.first_name} {address.last_name}
          </Text>
          <Text className="text-sm text-text-secondary mb-1">{address.address_1}</Text>
          <Text className="text-sm text-text-secondary mb-1">{address.address_2}</Text>
          <Text className="text-sm text-text-secondary mb-1">
            {address.city}
            {address.city ? "," : ""} {address.country} {address.postcode}
          </Text>
          <Text className="text-sm text-text-secondary">{address.phone}</Text>
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
      <ScrollView className="flex-1 bg-bg-medium">
        <View className="p-6 pt-0">
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
          <View className="flex-1 bg-black/80 justify-end">
            <View className="bg-bg-medium rounded-t-3xl max-h-[90%]">
              <View className="flex-row justify-between items-center p-6 border-b border-border-light">
                <Text className="text-xl font-bold text-white">Edit Address</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={24} color={Colors.textWhite} />
                </TouchableOpacity>
              </View>

              <ScrollView className="p-6">
                <View className="flex-row gap-3 mb-5">
                  <TouchableOpacity
                    className={`flex-1 p-3 rounded-xl border-2 items-center ${
                      formData.type === "shipping"
                        ? "border-rm-gold bg-rm-gold/20"
                        : "border-border-light"
                    }`}
                  >
                    <Text
                      className={`text-base font-semibold ${
                        formData.type === "shipping"
                          ? "text-rm-gold"
                          : "text-text-secondary"
                      }`}
                    >
                      Shipping
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 p-3 rounded-xl border-2 items-center ${
                      formData.type === "billing"
                        ? "border-rm-gold bg-rm-gold/20"
                        : "border-border-light"
                    }`}
                  >
                    <Text
                      className={`text-base font-semibold ${
                        formData.type === "billing"
                          ? "text-rm-gold"
                          : "text-text-secondary"
                      }`}
                    >
                      Billing
                    </Text>
                  </TouchableOpacity>
                </View>
                {formData.type === "billing" && (
                  <TextInput
                    className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white mb-4"
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
                  className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white mb-4"
                  value={formData.first_name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, first_name: text })
                  }
                  placeholder="First Name *"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white mb-4"
                  value={formData.last_name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, last_name: text })
                  }
                  placeholder="Last Name *"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white mb-4"
                  value={formData.company}
                  onChangeText={(text) =>
                    setFormData({ ...formData, company: text })
                  }
                  placeholder="Company"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white mb-4"
                  value={formData.address_1}
                  onChangeText={(text) =>
                    setFormData({ ...formData, address_1: text })
                  }
                  placeholder="Address 1"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white mb-4"
                  value={formData.address_2}
                  onChangeText={(text) =>
                    setFormData({ ...formData, address_2: text })
                  }
                  placeholder="Address 2"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white mb-4"
                  value={formData.city}
                  onChangeText={(text) =>
                    setFormData({ ...formData, city: text })
                  }
                  placeholder="Town / City *"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white mb-4"
                  value={formData.country}
                  onChangeText={(text) =>
                    setFormData({ ...formData, country: text })
                  }
                  placeholder="Country"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white mb-4"
                  value={formData.state}
                  onChangeText={(text) =>
                    setFormData({ ...formData, state: text })
                  }
                  placeholder="State / Country"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white mb-4"
                  value={formData.postcode}
                  onChangeText={(text) =>
                    setFormData({ ...formData, postcode: text })
                  }
                  placeholder="Postcode / ZIP"
                  placeholderTextColor={Colors.textLight}
                />
                <TextInput
                  className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white mb-4"
                  value={formData.phone}
                  onChangeText={(text) =>
                    setFormData({ ...formData, phone: text })
                  }
                  placeholder="Phone"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="phone-pad"
                />

                <TouchableOpacity
                  className="bg-rm-gold p-4 rounded-[25px] items-center mt-2"
                  onPress={handleSave}
                >
                  <Text className="text-base font-bold text-white">Save Address</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </>
  );
}

