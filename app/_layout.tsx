/* eslint-disable react-hooks/exhaustive-deps */
import { useCart } from "@/hooks/useCart";
import { useFootball } from "@/hooks/useFootball";
import { useUser } from "@/hooks/useUser";
import { store } from "@/store/store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StripeProvider } from "@stripe/stripe-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";

import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Provider } from "react-redux";
import { development } from "@/config/environment";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back", headerTintColor: "#000" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

const DataInitializer = () => {
  const { initializeAppData } = useFootball();
  const { loadUserData } = useUser();
  const { loadCartItems } = useCart();
  useEffect(() => {
    //AsyncStorage.clear();
    initializeAppData();
    loadUserData();
    loadCartItems();
  }, []);

  return null;
};

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StripeProvider
        publishableKey={development.STRIPE_PUBLISHABLE_KEY}
        merchantIdentifier="merchant.identifier" // required for Apple Pay
        urlScheme="your-url-scheme" // required for 3D Secure and bank redirects
      >
        <Provider store={store}>
          <DataInitializer />
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </Provider>
      </StripeProvider>
    </QueryClientProvider>
  );
}
