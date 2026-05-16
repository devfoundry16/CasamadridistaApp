/* eslint-disable react-hooks/exhaustive-deps */
import "@/i18n";
import { FontProvider, useFont } from "@/contexts/FontContext";
import { useFootball } from "@/hooks/useFootball";
import { useUser } from "@/hooks/useUser";
import { useEnvironment } from "@/hooks/useEnvironment";
import { useAuthCallbackDeeplink } from "@/hooks/useAuthCallbackDeeplink";
import { usePasswordResetDeeplink } from "@/hooks/usePasswordResetDeeplink";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { StripeProvider } from "@stripe/stripe-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Cairo_400Regular,
  Cairo_700Bold,
  useFonts,
} from "@expo-google-fonts/cairo";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View, I18nManager } from "react-native";
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
  const { fontFamilyBold } = useFont();
  const headerTitleStyle = {
    ...defaultOptions.headerTitleStyle,
    ...(fontFamilyBold ? { fontFamily: fontFamilyBold } : {}),
  };
  const options = { ...defaultOptions, headerTitleStyle };
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
            ...options,
          }}
        />
        <Stack.Screen
          name="auth/reset-password"
          options={{
            title: t("nav.setNewPassword"),
            ...options,
          }}
        />
        <Stack.Screen
          name="auth/callback"
          options={{
            ...options,
            title: t("nav.signingIn"),
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="account/wallet"
          options={{
            title: t("nav.wallet"),
            ...options,
          }}
        />
        <Stack.Screen
          name="account/details"
          options={{
            title: t("nav.accountDetails"),
            ...options,
          }}
        />
        <Stack.Screen
          name="account/subscription"
          options={{
            title: t("nav.subscription"),
            ...options,
          }}
        />
        <Stack.Screen
          name="about"
          options={{
            title: t("nav.about"),
            ...options,
          }}
        />
        <Stack.Screen
          name="contact"
          options={{
            title: t("nav.contact"),
            ...options,
          }}
        />
        <Stack.Screen
          name="privacy-policy"
          options={{
            title: t("nav.privacyPolicy"),
            ...options,
          }}
        />
        <Stack.Screen
          name="terms-of-service"
          options={{
            title: t("nav.termsOfService"),
            ...options,
          }}
        />
        <Stack.Screen
          name="campaign/[id]"
          options={{
            title: t("nav.campaignDetails"),
            ...options,
          }}
        />
        <Stack.Screen
          name="coach/[id]"
          options={{
            title: t("nav.coachDetails"),
            ...options,
          }}
        />
        <Stack.Screen
          name="league/[id]/[season]"
          options={{
            title: t("nav.leagueDetails"),
            ...options,
          }}
        />
        <Stack.Screen
          name="match/[id]"
          options={{
            title: t("nav.matchDetails"),
            ...options,
          }}
        />
        {/* <Stack.Screen
          name="memberships"
          options={{
            title: t("nav.membership"),
            ...options,
          }}
        />
        <Stack.Screen
          name="memberships/registration"
          options={{
            title: t("nav.memberRegistration"),
            ...options,
          }}
        /> */}
        <Stack.Screen
          name="fan-clubs/index"
          options={{
            title: t("nav.fanClubsTitle"),
            ...options,
          }}
        />
        <Stack.Screen
          name="fan-clubs/[country]"
          options={{
            title: t("nav.fanClubs"),
            ...options,
          }}
        />
        <Stack.Screen
          name="player/[team]/[id]"
          options={{
            title: t("nav.playerDetails"),
            ...options,
          }}
        />
        <Stack.Screen
          name="product/[id]"
          options={{
            title: t("nav.productDetails"),
            ...options,
          }}
        />
        <Stack.Screen
          name="team/[id]"
          options={{
            title: t("nav.teamDetails"),
            ...options,
          }}
        />
        <Stack.Screen
          name="venue/[id]"
          options={{
            title: t("nav.venueDetails"),
            ...options,
          }}
        />
        <Stack.Screen
          name="community/compose"
          options={{
            title: "New Post",
            headerShown: true,
            headerStyle: { backgroundColor: Colors.darkGold },
            headerTintColor: Colors.textWhite,
            headerTitleAlign: "center",
            headerTitleStyle: {
              color: Colors.textWhite,
              ...(fontFamilyBold ? { fontFamily: fontFamilyBold } : {}),
            },
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
    Promise.all([initializeAppData(), loadUserData()]).then(() => {
      SplashScreen.hideAsync();
    });
  }, []);

  return null;
};

function RootLayoutInner() {
  const { loadEnvironment } = useEnvironment();
  usePasswordResetDeeplink();
  useAuthCallbackDeeplink();
  const [fontsLoaded] = useFonts({
    Cairo_400Regular,
    Cairo_700Bold,
  });
  useEffect(() => {
    loadEnvironment();
  }, []);
  if (!fontsLoaded) {
    return null;
  }
  return (
    <StripeProvider
      publishableKey={development.STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.identifier" // required for Apple Pay
      urlScheme="your-url-scheme" // required for 3D Secure and bank redirects
    >
      <DataInitializer />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, direction: I18nManager.isRTL ? "rtl" : "ltr" }}>
          <FontProvider>
            <RootLayoutNav />
          </FontProvider>
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
