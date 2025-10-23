import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/hooks/useCart";
import { StripeProvider } from "@stripe/stripe-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back", headerTintColor: "#000" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StripeProvider
        publishableKey="pk_test_51SJbX1LKFkodhXbkhZyhK8koyJDiF3i0xhq2A3hdXj5DnZasByx2N8aCVp2GJZDLEFMm7EJiwYQOPJqKdA7ShN5j00IvGbHo3c"
        merchantIdentifier="merchant.identifier" // required for Apple Pay
        urlScheme="your-url-scheme" // required for 3D Secure and bank redirects
      >
        <AuthProvider>
          <AppProvider>
            <CartProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </CartProvider>
          </AppProvider>
        </AuthProvider>
      </StripeProvider>
    </QueryClientProvider>
  );
}
