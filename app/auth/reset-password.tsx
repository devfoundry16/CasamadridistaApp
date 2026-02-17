import { Spinner } from "@/components/Spinner";
import Colors from "@/constants/colors";
import { supabase } from "@/config/supabase";
import { router } from "expo-router";
import { Lock } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
  }, []);

  const handleSetPassword = async () => {
    if (!password || password.length < 6) {
      Alert.alert(t("common.error"), t("auth.passwordMinLength"));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t("common.error"), t("auth.passwordsDoNotMatch"));
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      setSuccess(true);
    } catch (err: any) {
      Alert.alert(t("common.error"), err?.message || t("auth.failedToUpdatePassword"));
    } finally {
      setIsLoading(false);
    }
  };

  if (hasSession === false) {
    return (
      <ScrollView
        className="flex-1 bg-bg-medium"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 }}
      >
        <View className="items-center mb-8">
          <Text className="text-[32px] font-bold text-rm-gold mb-2 text-center">{t("auth.invalidLink")}</Text>
          <Text className="text-base text-text-secondary text-center px-4">
            {t("auth.invalidLinkSubtitle")}
          </Text>
        </View>
        <TouchableOpacity
          className="bg-rm-gold p-4 rounded-[25px] items-center mt-2"
          onPress={() => router.replace("/(tabs)/account")}
        >
          <Text className="text-base font-bold text-white">{t("auth.backToLogin")}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (success) {
    return (
      <ScrollView
        className="flex-1 bg-bg-medium"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 }}
      >
        <View className="items-center mb-8">
          <Text className="text-[32px] font-bold text-rm-gold mb-2 text-center">{t("auth.passwordUpdated")}</Text>
          <Text className="text-base text-text-secondary text-center px-4">
            {t("auth.passwordUpdatedSubtitle")}
          </Text>
        </View>
        <TouchableOpacity
          className="bg-rm-gold p-4 rounded-[25px] items-center mt-2"
          onPress={() => router.replace("/(tabs)/account")}
        >
          <Text className="text-base font-bold text-white">{t("auth.logIn")}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (hasSession === null) {
    return (
      <View className="flex-1 bg-bg-medium justify-center items-center">
        <Spinner content={t("common.loading")} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-bg-medium"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
        className="flex-1"
      >
        <View className="items-center mb-6">
          <Text className="text-[32px] font-bold text-rm-gold mb-2 text-center">{t("auth.setNewPasswordTitle")}</Text>
          <Text className="text-base text-text-secondary text-center">
            {t("auth.setNewPasswordSubtitle")}
          </Text>
        </View>

        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">{t("auth.newPassword")}</Text>
          <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
            <Lock size={18} color={Colors.textWhite} />
            <TextInput
              className="flex-1 py-4 pl-3 text-base text-white"
              value={password}
              onChangeText={setPassword}
              placeholder={t("auth.placeholderPasswordMin")}
              placeholderTextColor={Colors.textLight}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>
        </View>
        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">{t("auth.confirmPassword")}</Text>
          <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
            <Lock size={18} color={Colors.textWhite} />
            <TextInput
              className="flex-1 py-4 pl-3 text-base text-white"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t("auth.placeholderConfirmNewPassword")}
              placeholderTextColor={Colors.textLight}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>
        </View>

        {isLoading && <Spinner content={t("auth.updatePassword")} />}
        {!isLoading && (
          <TouchableOpacity
            className="bg-rm-gold p-4 rounded-[25px] items-center mt-2"
            onPress={handleSetPassword}
          >
            <Text className="text-base font-bold text-white">{t("auth.updatePassword")}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className="mt-6 items-center"
          onPress={() => router.replace("/(tabs)/account")}
        >
          <Text className="text-sm text-rm-gold underline">{t("auth.backToLogin")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
