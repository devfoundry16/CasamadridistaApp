import { Spinner } from "@/components/Spinner";
import Colors from "@/constants/colors";
import AuthService from "@/services/AuthService";
import { router } from "expo-router";
import { Mail } from "lucide-react-native";
import React, { useState } from "react";
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

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendResetLink = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert(t("common.error"), t("auth.pleaseEnterEmail"));
      return;
    }
    setIsLoading(true);
    try {
      await AuthService.forgotPassword(trimmed);
      setSent(true);
    } catch (err: any) {
      Alert.alert(t("common.error"), err?.message || t("auth.failedToSendResetLink"));
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <ScrollView
        className="flex-1 bg-bg-medium"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 }}
      >
        <View className="items-center mb-8">
          <Text className="text-[32px] font-bold text-rm-gold mb-2 text-center">{t("auth.checkYourEmail")}</Text>
          <Text className="text-base text-text-secondary text-center px-4">
            {t("auth.resetLinkSent", { email: email.trim() })}
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
          <Text className="text-[32px] font-bold text-rm-gold mb-2 text-center">{t("auth.forgotPasswordTitle")}</Text>
          <Text className="text-base text-text-secondary text-center">
            {t("auth.forgotPasswordSubtitle")}
          </Text>
        </View>

        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">{t("auth.emailAddress")}</Text>
          <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
            <Mail size={18} color={Colors.textLight} />
            <TextInput
              className="flex-1 py-4 pl-3 text-base text-white"
              value={email}
              onChangeText={setEmail}
              placeholder={t("auth.enterEmail")}
              placeholderTextColor={Colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
            />
          </View>
        </View>

        {isLoading && <Spinner content={t("auth.sendResetLink")} />}
        {!isLoading && (
          <TouchableOpacity
            className="bg-rm-gold p-4 rounded-[25px] items-center mt-2"
            onPress={handleSendResetLink}
          >
            <Text className="text-base font-bold text-white">{t("auth.sendResetLink")}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className="mt-6 items-center"
          onPress={() => router.back()}
        >
          <Text className="text-sm text-rm-gold underline">{t("auth.backToLogin")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
