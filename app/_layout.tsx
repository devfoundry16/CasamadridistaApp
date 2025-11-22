/* eslint-disable react-hooks/exhaustive-deps */
import { useCart } from "@/hooks/useCart";
import { useFootball } from "@/hooks/useFootball";
import { useUser } from "@/hooks/useUser";
import { useEnvironment } from "@/hooks/useEnvironment";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StripeProvider } from "@stripe/stripe-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";

import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { development } from "@/config/environment";
import { StatusBar } from "expo-status-bar";
import Colors from "@/constants/colors";
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const defaultOptions: {
  headerShown: boolean;
  headerStyle: { backgroundColor: string };
  headerTitleAlign: "center";
  animation: "default";
} = {
  headerShown: true,
  headerStyle: { backgroundColor: Colors.darkGold },
  headerTitleAlign: "center",
  animation: "default",
};

function RootLayoutNav() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, title: "Home" }}
        />
        <Stack.Screen
          name="account/addresses"
          options={{
            ...defaultOptions,
            title: "Addresses",
          }}
        />
        <Stack.Screen
          name="account/wallet"
          options={{
            title: "Wallet",
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="account/details"
          options={{
            title: "Account Details",
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="account/orders"
          options={{
            title: "Orders",
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="account/subscription"
          options={{
            title: "Subscription",
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="about"
          options={{
            title: "About",
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="cart"
          options={{
            title: "Cart",
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="checkout"
          options={{
            title: "Checkout",
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="contact"
          options={{
            title: "Contact",
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="PayPalScreen"
          options={{
            title: "Paypal Payment",
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="privacy-policy"
          options={{
            title: "Privacy Policy",
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="terms-of-service"
          options={{
            title: "Terms of Service",
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="campaign/[id]"
          options={{
            title: "Campaign Details",
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="coach/[id]"
          options={{
            title: "Coach Details",
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="league/[id]/[season]"
          options={{
            title: "League Details",
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="match/[id]"
          options={{
            title: "Match Details",
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="memberships"
          options={{
            title: "Membership",
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="player/[team]/[id]"
          options={{
            title: "Player Details",
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="product/[id]"
          options={{
            title: "Product Details",
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="team/[id]"
          options={{
            title: "Team Details",
            ...defaultOptions,
          }}
        />
        <Stack.Screen
          name="venue/[id]"
          options={{
            title: "Venue Details",
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
  const { loadCartItems } = useCart();
  useEffect(() => {
    // AsyncStorage.clear();
    initializeAppData();
    loadUserData();
    loadCartItems();
  }, []);

  return null;
};

function RootLayoutInner() {
  const { loadEnvironment } = useEnvironment();
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
        <RootLayoutNav />
      </GestureHandlerRootView>
    </StripeProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <RootLayoutInner />
      </Provider>
    </QueryClientProvider>
  );
}
