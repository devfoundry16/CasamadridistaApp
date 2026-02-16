import { Spinner } from "@/components/Spinner";
import React from "react";
import { View } from "react-native";

/**
 * OAuth callback route. When the app opens via casamadridistaapp://auth/callback#...,
 * this screen is shown briefly while useAuthCallbackDeeplink (in root layout) processes
 * the URL and redirects to account.
 */
export default function AuthCallbackScreen() {
  return (
    <View className="flex-1 bg-bg-medium justify-center items-center">
      <Spinner content="Completing sign-in..." />
    </View>
  );
}
