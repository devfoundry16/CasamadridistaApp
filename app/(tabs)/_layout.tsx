import HeaderMenu from "@/components/HeaderMenu";
import Colors from "@/constants/colors";
import { Tabs } from "expo-router";
import { useEnvironment } from "@/hooks/useEnvironment";
import {
  Gamepad2,
  Heart,
  Home,
  LayoutGrid,
  ShoppingBag,
  User,
  Users,
} from "lucide-react-native";

import React, { useEffect } from "react";
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform, LogBox } from 'react-native';
LogBox.ignoreAllLogs(true);
export default function TabLayout() {
  const { revenueCat, loadEnvironment } = useEnvironment();

  useEffect(() => {
    loadEnvironment();
  }, [loadEnvironment]);

  useEffect(() => {
    if (!revenueCat.iosApiKey && !revenueCat.androidApiKey) {
      return; // Wait for keys to be loaded
    }
    
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    if (Platform.OS === 'ios' && revenueCat.iosApiKey) {
        Purchases.configure({ apiKey: revenueCat.iosApiKey });
    } else if (Platform.OS === 'android' && revenueCat.androidApiKey) {
        Purchases.configure({ apiKey: revenueCat.androidApiKey });
    }
}, [revenueCat]);
  return (
    <Tabs
      screenOptions={{
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
          title: "Home",
          headerTitle: "Casa Madridista",
          headerTitleAlign: "center",
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create-formation"
        options={{
          title: "Formation",
          headerTitle: "Formation Builder",
          headerTitleAlign: "center",
          tabBarIcon: ({ color, size }) => (
            <LayoutGrid size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="penalty"
        options={{
          title: "Penalty",
          headerTitle: "Penalty Game",
          headerTitleAlign: "center",
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
          title: "Team",
          headerTitle: "Ream Madrid Team",
          headerTitleAlign: "center",
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          headerTitle: "Shop",
          headerTitleAlign: "center",
          tabBarItemStyle: {
            display: "none",
          },
          tabBarIcon: ({ color, size }) => (
            <ShoppingBag size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="donate"
        options={{
          title: "Donation",
          headerTitle: "Donation",
          headerTitleAlign: "center",

          tabBarIcon: ({ color, size }) => (
            <Heart size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Profile",
          headerTitle: "My Account",
          headerTitleAlign: "center",
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
