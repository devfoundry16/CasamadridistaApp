import { useUser } from "@/hooks/useUser";
import UserService from "@/services/UserService";
import { router } from "expo-router";
import { Save } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AccountDetailsScreen() {
  const { user, updateUser } = useUser();
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    name: user?.name || "",
    oldPassword: "",
    password: "",
    confirmPassword: "",
  });
  const checkPassword = async (password: string) => {
    const response = await UserService.validCrendential(
      user?.username as any,
      password
    );
    return response;
  };
  const handleSave = async () => {
    if (!formData.first_name || !formData.last_name || !formData.name) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    if (formData.oldPassword !== "") {
      try {
        const isValid = await checkPassword(formData.oldPassword);
        if (formData.password !== formData.confirmPassword) {
          Alert.alert("Error", "Confirm password is incorrect");
          return;
        } else {
          if (!isValid) {
            Alert.alert("Error", "Current Password is not correct");
            return;
          }
        }
      } catch (error: any) {
        Alert.alert("Error", error.message);
        return;
      }
    }
    let newData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      name: formData.name,
    };
    if (formData.oldPassword === "") updateUser({ id: user?.id, ...newData });
    else updateUser({ id: user?.id, ...formData });
    router.navigate("/account");
    Alert.alert("Success", "Updated Successfully");
  };

  return (
    <ScrollView className="flex-1 bg-bg-medium">
      <View className="p-6">
        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">First Name *</Text>
          <TextInput
            className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white"
            value={formData.first_name}
            onChangeText={(text) =>
              setFormData({ ...formData, first_name: text })
            }
            placeholder="Enter your first name"
            placeholderTextColor="#515151"
          />
        </View>
        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">Last Name *</Text>
          <TextInput
            className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white"
            value={formData.last_name}
            onChangeText={(text) =>
              setFormData({ ...formData, last_name: text })
            }
            placeholder="Enter your last name"
            placeholderTextColor="#515151"
          />
        </View>
        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">Display Name *</Text>
          <TextInput
            className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter your display name"
            placeholderTextColor="#515151"
          />
        </View>
        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">Email Address</Text>
          <TextInput
            className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="Enter your email"
            placeholderTextColor="#515151"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">Password</Text>
          <TextInput
            className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white"
            value={formData.oldPassword}
            onChangeText={(text) =>
              setFormData({ ...formData, oldPassword: text })
            }
            placeholder="Enter your current password"
            placeholderTextColor="#515151"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">New Password</Text>
          <TextInput
            className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white"
            value={formData.password}
            onChangeText={(text) =>
              setFormData({ ...formData, password: text })
            }
            placeholder="Enter your new password"
            placeholderTextColor="#515151"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">Confirm Password</Text>
          <TextInput
            className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white"
            value={formData.confirmPassword}
            onChangeText={(text) =>
              setFormData({ ...formData, confirmPassword: text })
            }
            placeholder="Enter confirm password"
            placeholderTextColor="#515151"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          className="flex-row items-center justify-center bg-rm-gold p-4 rounded-[25px] mt-2 gap-2"
          onPress={handleSave}
        >
          <Save size={20} color="#FFFFFF" />
          <Text className="text-base font-bold text-white">Save Changes</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
