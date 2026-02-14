import { Spinner } from "@/components/Spinner";
import Colors from "@/constants/colors";
import { supabase } from "@/config/supabase";
import { router } from "expo-router";
import { Lock } from "lucide-react-native";
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
      <ScrollView
        className="flex-1 bg-bg-medium"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 }}
      >
        <View className="items-center mb-8">
          <Text className="text-[32px] font-bold text-rm-gold mb-2 text-center">Invalid or expired link</Text>
          <Text className="text-base text-text-secondary text-center px-4">
            This password reset link is invalid or has expired. Please request a new one from the login screen.
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

  if (success) {
    return (
      <ScrollView
        className="flex-1 bg-bg-medium"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 }}
      >
        <View className="items-center mb-8">
          <Text className="text-[32px] font-bold text-rm-gold mb-2 text-center">Password updated</Text>
          <Text className="text-base text-text-secondary text-center px-4">
            Your password has been changed. Please log in with your new password.
          </Text>
        </View>
        <TouchableOpacity
          className="bg-rm-gold p-4 rounded-[25px] items-center mt-2"
          onPress={() => router.replace("/(tabs)/account")}
        >
          <Text className="text-base font-bold text-white">Log in</Text>
        </TouchableOpacity>
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
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
        className="flex-1"
      >
        <View className="items-center mb-6">
          <Text className="text-[32px] font-bold text-rm-gold mb-2 text-center">Set new password</Text>
          <Text className="text-base text-text-secondary text-center">
            Enter your new password below.
          </Text>
        </View>

        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">New password *</Text>
          <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
            <Lock size={18} color={Colors.textWhite} />
            <TextInput
              className="flex-1 py-4 pl-3 text-base text-white"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={Colors.textLight}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>
        </View>
        <View className="mb-5">
          <Text className="text-sm font-semibold text-white mb-2">Confirm password *</Text>
          <View className="bg-bg-light border border-border-light rounded-xl px-4 flex-row items-center">
            <Lock size={18} color={Colors.textWhite} />
            <TextInput
              className="flex-1 py-4 pl-3 text-base text-white"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your new password"
              placeholderTextColor={Colors.textLight}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
