import HeaderMenu from "@/components/HeaderMenu";
import Colors from "@/constants/colors";
import { Tabs } from "expo-router";
import {
  Gamepad2,
  Home,
  Layout,
  ShoppingBag,
  Users as Team,
  UserCircle,
  Gift,
} from "lucide-react-native";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.darkGold,
        tabBarInactiveTintColor: Colors.darkGray,
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.secondary,
        },
        headerTintColor: Colors.textWhite,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "600" as const,
        },
        tabBarStyle: {
          backgroundColor: Colors.primary,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600" as const,
        },
        headerRight: () => <HeaderMenu />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerTitle: "Casamadridista",
          headerTitleAlign: "center",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="penalty"
        options={{
          title: "Penalty",
          headerTitle: "Penalty Game",
          headerTitleAlign: "center",
          tabBarIcon: ({ color, size }) => (
            <Gamepad2 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create-formation"
        options={{
          title: "Formation",
          headerTitle: "Formation Builder",
          headerTitleAlign: "center",
          tabBarIcon: ({ color, size }) => <Layout size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: "Team",
          headerTitle: "Ream Madrid Team",
          headerTitleAlign: "center",
          tabBarIcon: ({ color, size }) => <Team size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          headerTitle: "Shop",
          headerTitleAlign: "center",
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
          tabBarIcon: ({ color, size }) => <Gift size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          headerTitle: "My Account",
          headerTitleAlign: "center",
          tabBarIcon: ({ color, size }) => (
            <UserCircle size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
