import Colors from "@/constants/colors";
import { useUser } from "@/hooks/useUser";
import AuthService from "@/services/AuthService";
import { router } from "expo-router";
import { Lock, Mail, Phone, Save, User } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AccountDetailsScreen() {
  const { t } = useTranslation();
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
      Alert.alert(t("common.error"), t("account.pleaseFillRequiredFields"));
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
          Alert.alert(t("common.error"), t("auth.passwordsDoNotMatch"));
          return;
        }
        
        // Verify current password by attempting login
        try {
          await AuthService.validateCredentials(user?.email || "", formData.oldPassword);
          await AuthService.changePassword(formData.password);
        } catch (error) {
          Alert.alert(t("common.error"), t("auth.currentPasswordIncorrect"));
          return;
        }
      }

      router.navigate("/account");
      Alert.alert(t("common.success"), t("account.profileUpdated"));
    } catch (error: any) {
      Alert.alert(t("common.error"), error.message || t("account.failedToUpdateProfile"));
    }
  };

  return (
    <ScrollView className="flex-1 bg-bg-medium">
      <View className="p-6">
        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">{t("auth.firstName")}</Text>
          <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
            <User size={18} color={Colors.textLight} />
            <TextInput
              className="flex-1 py-4 pl-3 text-base text-white"
              value={formData.firstName}
              onChangeText={(text) =>
                setFormData({ ...formData, firstName: text })
              }
              placeholder={t("account.placeholderFirstName")}
              placeholderTextColor={Colors.textLight}
            />
          </View>
        </View>
        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">{t("auth.lastName")}</Text>
          <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
            <User size={18} color={Colors.textLight} />
            <TextInput
              className="flex-1 py-4 pl-3 text-base text-white"
              value={formData.lastName}
              onChangeText={(text) =>
                setFormData({ ...formData, lastName: text })
              }
              placeholder={t("account.placeholderLastName")}
              placeholderTextColor={Colors.textLight}
            />
          </View>
        </View>
        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">{t("auth.phone")}</Text>
          <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
            <Phone size={18} color={Colors.textLight} />
            <TextInput
              className="flex-1 py-4 pl-3 text-base text-white"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder={t("account.placeholderPhone")}
              placeholderTextColor={Colors.textLight}
              keyboardType="phone-pad"
            />
          </View>
        </View>
        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">{t("account.emailReadOnly")}</Text>
          <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
            <Mail size={18} color={Colors.textLight} />
            <TextInput
              className="flex-1 py-4 pl-3 text-base text-gray-400"
              value={formData.email}
              placeholder={t("account.placeholderEmailCannotChange")}
              placeholderTextColor={Colors.textLight}
              editable={false}
            />
          </View>
        </View>

        <Text className="text-lg font-bold text-white mb-4 mt-6">{t("account.changePassword")}</Text>

        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">{t("account.currentPassword")}</Text>
          <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
            <Lock size={18} color={Colors.textLight} />
            <TextInput
              className="flex-1 py-4 pl-3 text-base text-white"
              value={formData.oldPassword}
              onChangeText={(text) =>
                setFormData({ ...formData, oldPassword: text })
              }
              placeholder={t("account.placeholderCurrentPassword")}
              placeholderTextColor={Colors.textLight}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        </View>

        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">{t("account.newPassword")}</Text>
          <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
            <Lock size={18} color={Colors.textLight} />
            <TextInput
              className="flex-1 py-4 pl-3 text-base text-white"
              value={formData.password}
              onChangeText={(text) =>
                setFormData({ ...formData, password: text })
              }
              placeholder={t("account.placeholderNewPassword")}
              placeholderTextColor={Colors.textLight}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
        </View>

        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">{t("account.confirmNewPassword")}</Text>
          <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
            <Lock size={18} color={Colors.textLight} />
            <TextInput
              className="flex-1 py-4 pl-3 text-base text-white"
              value={formData.confirmPassword}
              onChangeText={(text) =>
                setFormData({ ...formData, confirmPassword: text })
              }
              placeholder={t("account.placeholderConfirmNewPassword")}
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
          <Text className="text-base font-bold text-white">{t("account.saveChanges")}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
