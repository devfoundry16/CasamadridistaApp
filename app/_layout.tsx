import Colors from "@/constants/colors";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="about"
        options={{
          ...headerOptions,
          title: "About",
        }}
      />
      <Stack.Screen
        name="contact"
        options={{
          ...headerOptions,
          title: "Contact",
        }}
      />
      <Stack.Screen
        name="memberships"
        options={{
          ...headerOptions,
          title: "Memberships",
        }}
      />
      <Stack.Screen
        name="campaigns"
        options={{
          ...headerOptions,
          title: "Campaigns",
        }}
      />
      <Stack.Screen
        name="team/[id]"
        options={{
          ...headerOptions,
          title: "Team Details",
        }}
      />
      <Stack.Screen
        name="match/[id]"
        options={{
          ...headerOptions,
          title: "Match Details",
        }}
      />
      <Stack.Screen
        name="league/[id]/[season]"
        options={{
          ...headerOptions,
          title: "League Details",
        }}
      />
      <Stack.Screen
        name="venue/[id]"
        options={{
          ...headerOptions,
          title: "Venue Details",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <AppProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const headerOptions = {
  headerShown: true,
  headerBackButtonDisplayMode: "minimal" as const,
  headerTintColor: Colors.textWhite,
  headerStyle: { backgroundColor: Colors.darkGold},
  headerTitleStyle: { fontWeight: "700" as const },
}