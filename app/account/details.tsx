import Colors from "@/constants/colors";
import { useUser } from "@/hooks/useUser";
import AuthService from "@/services/AuthService";
import { router } from "expo-router";
import { Lock, Mail, Phone, Save, User } from "lucide-react-native";
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
    firstName: user?.profile?.first_name || "",
    lastName: user?.profile?.last_name || "",
    phone: user?.profile?.phone || "",
    email: user?.email || "",
    oldPassword: "",
    password: "",
    confirmPassword: "",
  });

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      // Update profile
      await updateUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      });

      // Update password if provided
      if (formData.oldPassword && formData.password) {
        if (formData.password !== formData.confirmPassword) {
          Alert.alert("Error", "Passwords do not match");
          return;
        }
        
        // Verify current password by attempting login
        try {
          await AuthService.validateCredentials(user?.email || "", formData.oldPassword);
          await AuthService.changePassword(formData.password);
        } catch (error) {
          Alert.alert("Error", "Current password is incorrect");
          return;
        }
      }

      router.navigate("/account");
      Alert.alert("Success", "Profile updated successfully");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile");
    }
  };

  return (
    <ScrollView className="flex-1 bg-bg-medium">
      <View className="p-6">
        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">First Name *</Text>
          <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
            <User size={18} color={Colors.textLight} />
            <TextInput
              className="flex-1 py-4 pl-3 text-base text-white"
              value={formData.firstName}
              onChangeText={(text) =>
                setFormData({ ...formData, firstName: text })
              }
              placeholder="Enter your first name"
              placeholderTextColor={Colors.textLight}
            />
          </View>
        </View>
        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">Last Name *</Text>
          <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
            <User size={18} color={Colors.textLight} />
            <TextInput
              className="flex-1 py-4 pl-3 text-base text-white"
              value={formData.lastName}
              onChangeText={(text) =>
                setFormData({ ...formData, lastName: text })
              }
              placeholder="Enter your last name"
              placeholderTextColor={Colors.textLight}
            />
          </View>
        </View>
        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">Phone</Text>
          <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
            <Phone size={18} color={Colors.textLight} />
            <TextInput
              className="flex-1 py-4 pl-3 text-base text-white"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="Enter your phone number"
              placeholderTextColor={Colors.textLight}
              keyboardType="phone-pad"
            />
          </View>
        </View>
        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">Email Address (Read-only)</Text>
          <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
            <Mail size={18} color={Colors.textLight} />
            <TextInput
              className="flex-1 py-4 pl-3 text-base text-gray-400"
              value={formData.email}
              placeholder="Email cannot be changed"
              placeholderTextColor={Colors.textLight}
              editable={false}
            />
          </View>
        </View>

        <Text className="text-lg font-bold text-white mb-4 mt-6">Change Password</Text>

        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">Current Password</Text>
          <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
            <Lock size={18} color={Colors.textLight} />
            <TextInput
              className="flex-1 py-4 pl-3 text-base text-white"
              value={formData.oldPassword}
              onChangeText={(text) =>
                setFormData({ ...formData, oldPassword: text })
              }
              placeholder="Enter your current password"
              placeholderTextColor={Colors.textLight}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        </View>

        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">New Password</Text>
          <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
            <Lock size={18} color={Colors.textLight} />
            <TextInput
              className="flex-1 py-4 pl-3 text-base text-white"
              value={formData.password}
              onChangeText={(text) =>
                setFormData({ ...formData, password: text })
              }
              placeholder="Enter your new password"
              placeholderTextColor={Colors.textLight}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        </View>

        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">Confirm New Password</Text>
          <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
            <Lock size={18} color={Colors.textLight} />
            <TextInput
              className="flex-1 py-4 pl-3 text-base text-white"
              value={formData.confirmPassword}
              onChangeText={(text) =>
                setFormData({ ...formData, confirmPassword: text })
              }
              placeholder="Confirm your new password"
              placeholderTextColor={Colors.textLight}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
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
