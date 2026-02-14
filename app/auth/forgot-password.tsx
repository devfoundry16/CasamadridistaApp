import { Spinner } from "@/components/Spinner";
import Colors from "@/constants/colors";
import AuthService from "@/services/AuthService";
import { router } from "expo-router";
import { Mail } from "lucide-react-native";
import React, { useState } from "react";
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
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendResetLink = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }
    setIsLoading(true);
    try {
      await AuthService.forgotPassword(trimmed);
      setSent(true);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to send reset link");
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
          <Text className="text-[32px] font-bold text-rm-gold mb-2 text-center">Check your email</Text>
          <Text className="text-base text-text-secondary text-center px-4">
            We sent a password reset link to {email.trim()}. Open the link on this device so the app can open and let you set a new password.
          </Text>
        </View>
        <TouchableOpacity
          className="bg-rm-gold p-4 rounded-[25px] items-center mt-2"
          onPress={() => router.replace("/(tabs)/account")}
        >
          <Text className="text-base font-bold text-white">Back to login</Text>
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
          <Text className="text-[32px] font-bold text-rm-gold mb-2 text-center">Forgot password?</Text>
          <Text className="text-base text-text-secondary text-center">
            Enter your email and we&apos;ll send you a link to reset your password.
          </Text>
        </View>

        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">Email Address *</Text>
          <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
            <Mail size={18} color={Colors.textLight} />
            <TextInput
              className="flex-1 py-4 pl-3 text-base text-white"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={Colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
            />
          </View>
        </View>

        {isLoading && <Spinner content="Sending reset link" />}
        {!isLoading && (
          <TouchableOpacity
            className="bg-rm-gold p-4 rounded-[25px] items-center mt-2"
            onPress={handleSendResetLink}
          >
            <Text className="text-base font-bold text-white">Send reset link</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className="mt-6 items-center"
          onPress={() => router.back()}
        >
          <Text className="text-sm text-rm-gold underline">Back to login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
