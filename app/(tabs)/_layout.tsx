import HeaderMenu from "@/components/HeaderMenu";
import Colors from "@/constants/colors";
import { Tabs } from "expo-router";
import { useFont } from "@/contexts/FontContext";
import { useEnvironment } from "@/hooks/useEnvironment";
import { useUser } from "@/hooks/useUser";
import {
  Gamepad2,
  Heart,
  Home,
  LayoutGrid,
  MessageCircle,
  ShoppingBag,
  User,
  Users,
} from "lucide-react-native";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform, LogBox } from 'react-native';
LogBox.ignoreAllLogs(true);
export default function TabLayout() {
  const { revenueCat, loadEnvironment } = useEnvironment();
  const { user } = useUser();
  const { t } = useTranslation();
  const { fontFamilyBold } = useFont();
  useEffect(() => {
    loadEnvironment();
  }, [loadEnvironment]);

  useEffect(() => {
    if ((!revenueCat.iosApiKey && !revenueCat.androidApiKey) || !user?.id) {
      return;
    }

    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    if (Platform.OS === 'ios' && revenueCat.iosApiKey) {
        Purchases.configure({ apiKey: revenueCat.iosApiKey, appUserID: user.id });
    } else if (Platform.OS === 'android' && revenueCat.androidApiKey) {
        Purchases.configure({ apiKey: revenueCat.androidApiKey, appUserID: user.id });
    }
  }, [revenueCat, user?.id]);
  return (
    <Tabs
      screenOptions={{
        tabBarLabelStyle: {
          ...(fontFamilyBold ? { fontFamily: fontFamilyBold } : {}),
        },
        tabBarActiveTintColor: Colors.darkGold,
        tabBarInactiveTintColor: Colors.darkGray,
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.darkGold,
          height: 120,
        },
        headerTintColor: Colors.textWhite,
        headerRight: () => <HeaderMenu />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("nav.home"),
          headerTitle: t("nav.appName"),
          headerTitleStyle: {
            ...(fontFamilyBold ? { fontFamily: fontFamilyBold } : {}),
          },
          headerTitleAlign: "center",
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create-formation"
        options={{
          title: t("nav.formation"),
          headerTitle: t("nav.formationBuilder"),
          headerTitleAlign: "center",
          headerTitleStyle: {
            ...(fontFamilyBold ? { fontFamily: fontFamilyBold } : {}),
          },
          tabBarIcon: ({ color, size }) => (
            <LayoutGrid size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="penalty"
        options={{
          title: t("nav.penalty"),
          headerTitle: t("nav.penaltyGame"),
          headerTitleAlign: "center",
          headerTitleStyle: {
            ...(fontFamilyBold ? { fontFamily: fontFamilyBold } : {}),
          },
          headerShown: false,
          tabBarPosition: "right",
          tabBarItemStyle: {
            width: 30,
          },
          tabBarStyle: {
            display: "none",
          },
          tabBarIcon: ({ color, size }) => (
            <Gamepad2 size={size + 5} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: t("nav.team"),
          headerTitle: t("nav.realMadridTeam"),
          headerTitleAlign: "center",
          headerTitleStyle: { 
            ...(fontFamilyBold ? { fontFamily: fontFamilyBold } : {}),
          },
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: t("nav.shop"),
          headerTitle: t("nav.shop"),
          headerTitleAlign: "center",
          headerTitleStyle: {
            ...(fontFamilyBold ? { fontFamily: fontFamilyBold } : {}),
          },
          tabBarItemStyle: {
            display: "none",
          },
          tabBarIcon: ({ color, size }) => (
            <ShoppingBag size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: t("nav.community"),
          headerTitle: t("nav.madristaFeed"),
          headerTitleAlign: "center",
          headerTitleStyle: {
            ...(fontFamilyBold ? { fontFamily: fontFamilyBold } : {}),
          },
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="donate"
        options={{
          title: t("nav.donation"),
          headerTitle: t("nav.donation"),
          headerTitleAlign: "center",
          headerTitleStyle: {
            ...(fontFamilyBold ? { fontFamily: fontFamilyBold } : {}),
          },
          tabBarIcon: ({ color, size }) => (
            <Heart size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t("nav.profile"),
          headerTitle: t("nav.myAccount"),
          headerTitleAlign: "center",
          headerTitleStyle: {
            ...(fontFamilyBold ? { fontFamily: fontFamilyBold } : {}),
          },
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
