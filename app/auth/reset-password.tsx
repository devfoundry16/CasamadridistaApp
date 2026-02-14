import { Spinner } from "@/components/Spinner";
import Colors from "@/constants/colors";
import { supabase } from "@/config/supabase";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      await supabase.auth.signOut();
      setSuccess(true);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  if (hasSession === false) {
    return (
      <ScrollView className="flex-1 bg-bg-medium">
        <View className="p-8 items-center bg-bg-deep-dark">
          <Text className="text-[32px] font-bold text-rm-gold mb-2">Invalid or expired link</Text>
          <Text className="text-base text-text-secondary text-center px-4">
            This password reset link is invalid or has expired. Please request a new one from the login screen.
          </Text>
        </View>
        <View className="p-6">
          <TouchableOpacity
            className="bg-rm-gold p-4 rounded-[25px] items-center mt-2"
            onPress={() => router.replace("/(tabs)/account")}
          >
            <Text className="text-base font-bold text-white">Back to login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (success) {
    return (
      <ScrollView className="flex-1 bg-bg-medium">
        <View className="p-8 items-center bg-bg-deep-dark">
          <Text className="text-[32px] font-bold text-rm-gold mb-2">Password updated</Text>
          <Text className="text-base text-text-secondary text-center px-4">
            Your password has been changed. Please log in with your new password.
          </Text>
        </View>
        <View className="p-6">
          <TouchableOpacity
            className="bg-rm-gold p-4 rounded-[25px] items-center mt-2"
            onPress={() => router.replace("/(tabs)/account")}
          >
            <Text className="text-base font-bold text-white">Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (hasSession === null) {
    return (
      <View className="flex-1 bg-bg-medium justify-center items-center">
        <Spinner content="Loading" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-bg-medium"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="flex-1"
      >
        <View className="p-8 items-center bg-bg-deep-dark">
          <Text className="text-[32px] font-bold text-rm-gold mb-2">Set new password</Text>
          <Text className="text-base text-text-secondary text-center">
            Enter your new password below.
          </Text>
        </View>

        <View className="p-6">
          <View className="mb-5">
            <Text className="text-sm font-semibold text-white mb-2">New password *</Text>
            <TextInput
              className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={Colors.darkGray}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>
          <View className="mb-5">
            <Text className="text-sm font-semibold text-white mb-2">Confirm password *</Text>
            <TextInput
              className="bg-bg-light border border-border-light rounded-xl p-4 text-base text-white"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your new password"
              placeholderTextColor={Colors.darkGray}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          {isLoading && <Spinner content="Updating password" />}
          {!isLoading && (
            <TouchableOpacity
              className="bg-rm-gold p-4 rounded-[25px] items-center mt-2"
              onPress={handleSetPassword}
            >
              <Text className="text-base font-bold text-white">Update password</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="mt-6 items-center"
            onPress={() => router.replace("/(tabs)/account")}
          >
            <Text className="text-sm text-rm-gold underline">Back to login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
