/* eslint-disable react-hooks/exhaustive-deps */
import "@/i18n";
import { useFootball } from "@/hooks/useFootball";
import { useUser } from "@/hooks/useUser";
import { useEnvironment } from "@/hooks/useEnvironment";
import { useAuthCallbackDeeplink } from "@/hooks/useAuthCallbackDeeplink";
import { usePasswordResetDeeplink } from "@/hooks/usePasswordResetDeeplink";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StripeProvider } from "@stripe/stripe-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View } from "react-native";
import { I18nManager } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { development } from "@/config/environment";
import { StatusBar } from "expo-status-bar";
import Colors from "@/constants/colors";
import "./global.css";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const defaultOptions: {
  headerShown: boolean;
  headerStyle: { backgroundColor: string };
  headerTintColor: string;
  headerTitleStyle: { color: string };
  headerTitleAlign: "center";
  animation: "default";
} = {
  headerShown: true,
  headerStyle: { backgroundColor: Colors.darkGold },
  headerTintColor: Colors.text.primary,
  headerTitleStyle: { color: Colors.text.primary },
  headerTitleAlign: "center",
  animation: "default",
};

function RootLayoutNav() {
  const { t } = useTranslation();
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, title: t("nav.home") }}
        />
        <Stack.Screen
          name="auth/forgot-password"
          options={{
            title: t("nav.forgotPassword"),
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="auth/reset-password"
          options={{
            title: t("nav.setNewPassword"),
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="auth/callback"
          options={{
            ...defaultOptions,
            title: t("nav.signingIn"),
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="account/wallet"
          options={{
            title: t("nav.wallet"),
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="account/details"
          options={{
            title: t("nav.accountDetails"),
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="account/subscription"
          options={{
            title: t("nav.subscription"),
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="about"
          options={{
            title: t("nav.about"),
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="contact"
          options={{
            title: t("nav.contact"),
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="privacy-policy"
          options={{
            title: t("nav.privacyPolicy"),
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="terms-of-service"
          options={{
            title: t("nav.termsOfService"),
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="campaign/[id]"
          options={{
            title: t("nav.campaignDetails"),
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="coach/[id]"
          options={{
            title: t("nav.coachDetails"),
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="league/[id]/[season]"
          options={{
            title: t("nav.leagueDetails"),
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="match/[id]"
          options={{
            title: t("nav.matchDetails"),
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="memberships"
          options={{
            title: t("nav.membership"),
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="player/[team]/[id]"
          options={{
            title: t("nav.playerDetails"),
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="product/[id]"
          options={{
            title: t("nav.productDetails"),
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="team/[id]"
          options={{
            title: t("nav.teamDetails"),
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="venue/[id]"
          options={{
            title: t("nav.venueDetails"),
            ...defaultOptions,
          }}
        />
      </Stack>
    </>
  );
}

const DataInitializer = () => {
  const { initializeAppData } = useFootball();
  const { loadUserData } = useUser();

  useEffect(() => {
    Promise.all([initializeAppData(), loadUserData()]).then(
      () => {
        SplashScreen.hideAsync();
      }
    );
  }, []);

  return null;
};

function RootLayoutInner() {
  const { loadEnvironment } = useEnvironment();
  usePasswordResetDeeplink();
  useAuthCallbackDeeplink();
  useEffect(() => {
    loadEnvironment();
  }, []);
  return (
    <StripeProvider
      publishableKey={development.STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.identifier" // required for Apple Pay
      urlScheme="your-url-scheme" // required for 3D Secure and bank redirects
    >
      <DataInitializer />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, direction: I18nManager.isRTL ? "rtl" : "ltr" }}>
          <RootLayoutNav />
        </View>
      </GestureHandlerRootView>
    </StripeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <RootLayoutInner />
      </Provider>
    </QueryClientProvider>
  );
}
